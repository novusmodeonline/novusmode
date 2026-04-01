import { randomUUID } from "crypto";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import prisma from "@/lib/prisma";

const GUEST_COOKIE_NAME = "guest_cart";
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// ---------------------------------------------------------------------------
// Token hashing
// ---------------------------------------------------------------------------

/**
 * SHA-256 hash a raw guest token for DB storage.
 * Never store the raw token in DB.
 */
export function hashGuestToken(rawToken) {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Constant-time comparison of two hex-encoded hashes.
 */
export function safeCompareHashes(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/**
 * Read the raw guest token from the cookie jar.
 * Returns null if not present.
 */
export async function readGuestTokenCookie() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(GUEST_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Read-or-create a guest token.
 * Returns { rawToken, isNew }.
 * The cookie is set on the response when isNew === true
 * (caller must use setGuestCookie on the response).
 */
export async function getOrCreateGuestToken() {
  const existing = await readGuestTokenCookie();
  if (existing) {
    return { rawToken: existing, isNew: false };
  }
  const rawToken = randomUUID();
  return { rawToken, isNew: true };
}

/**
 * Build cookie options for the guest token cookie.
 */
export function guestCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  };
}

/**
 * Set the guest_cart cookie on a NextResponse.
 */
export function setGuestCookie(response, rawToken) {
  response.cookies.set(GUEST_COOKIE_NAME, rawToken, guestCookieOptions());
  return response;
}

/**
 * Clear the guest_cart cookie on a NextResponse.
 */
export function clearGuestCookie(response) {
  response.cookies.set(GUEST_COOKIE_NAME, "", {
    ...guestCookieOptions(),
    maxAge: 0,
  });
  return response;
}

// ---------------------------------------------------------------------------
// Owner resolution
// ---------------------------------------------------------------------------

/**
 * Resolve cart owner from the current request context.
 *
 * Returns one of:
 *   { type: "user",  userId: string }
 *   { type: "guest", guestTokenHash: string, rawToken: string, isNewToken: boolean }
 *   null  (only when requireOwner=false and no identity available)
 *
 * For write operations, pass createIfMissing=true so a guest token is generated
 * when the user is unauthenticated and has no existing cookie.
 */
export async function resolveCartOwner({ createIfMissing = false } = {}) {
  // 1. Check session first — authenticated user always wins
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { type: "user", userId: session.user.id };
  }

  // 2. Guest path
  if (createIfMissing) {
    const { rawToken, isNew } = await getOrCreateGuestToken();
    return {
      type: "guest",
      guestTokenHash: hashGuestToken(rawToken),
      rawToken,
      isNewToken: isNew,
    };
  }

  // Read-only: only resolve if cookie exists
  const rawToken = await readGuestTokenCookie();
  if (rawToken) {
    return {
      type: "guest",
      guestTokenHash: hashGuestToken(rawToken),
      rawToken,
      isNewToken: false,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cart CRUD by owner
// ---------------------------------------------------------------------------

/**
 * Find the active cart for a resolved owner.
 * Returns the cart (with items + product) or null.
 */
export async function findActiveCart(owner) {
  const where =
    owner.type === "user"
      ? { userId: owner.userId, status: "active" }
      : { guestTokenHash: owner.guestTokenHash, status: "active" };

  return prisma.cart.findFirst({
    where,
    include: {
      items: { include: { product: true } },
    },
  });
}

/**
 * Find or create an active cart for the given owner.
 * Enforces XOR invariant: userId OR guestTokenHash, never both.
 */
export async function getOrCreateCartByOwner(owner) {
  const existing = await findActiveCart(owner);
  if (existing) return existing;

  if (owner.type === "guest") {
    // Prefer reviving an abandoned guest cart to preserve user intent.
    const abandoned = await prisma.cart.findFirst({
      where: {
        guestTokenHash: owner.guestTokenHash,
        status: "abandoned",
      },
      orderBy: { updatedAt: "desc" },
      include: {
        items: { include: { product: true } },
      },
    });

    if (abandoned) {
      return prisma.cart.update({
        where: { id: abandoned.id },
        data: {
          status: "active",
          version: { increment: 1 },
          lastActivityAt: new Date(),
        },
        include: {
          items: { include: { product: true } },
        },
      });
    }

    // Legacy safety: release token from any non-active cart that still holds it.
    const legacyNonActive = await prisma.cart.findFirst({
      where: {
        guestTokenHash: owner.guestTokenHash,
        NOT: { status: "active" },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (legacyNonActive) {
      await prisma.cart.update({
        where: { id: legacyNonActive.id },
        data: { guestTokenHash: null },
      });
    }
  }

  const data =
    owner.type === "user"
      ? { userId: owner.userId, status: "active" }
      : { guestTokenHash: owner.guestTokenHash, status: "active" };

  return prisma.cart.create({
    data,
    include: {
      items: { include: { product: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Optimistic version check
// ---------------------------------------------------------------------------

/**
 * Verify the supplied version matches the current cart version.
 * Returns { ok: true } or { ok: false, currentVersion }.
 */
export async function checkVersion(cartId, expectedVersion) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    select: { version: true },
  });
  if (!cart) return { ok: false, currentVersion: null };
  if (cart.version !== expectedVersion) {
    return { ok: false, currentVersion: cart.version };
  }
  return { ok: true };
}

/**
 * Bump version + lastActivityAt on a cart.
 * Returns the updated cart.
 */
export async function bumpVersion(cartId) {
  return prisma.cart.update({
    where: { id: cartId },
    data: {
      version: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// Cart totals computation (shared helper)
// ---------------------------------------------------------------------------

/**
 * Given a cart object (with items[].product), compute totals.
 */
export function computeCartTotals(cart) {
  if (!cart || !cart.items?.length) {
    return { total: 0, allQuantity: 0 };
  }
  let total = 0;
  let allQuantity = 0;
  for (const item of cart.items) {
    const unitPrice = item.unitPriceSnapshot ?? item.product.price;
    total += Math.round(unitPrice * item.quantity);
    allQuantity += item.quantity;
  }
  return { total, allQuantity };
}
