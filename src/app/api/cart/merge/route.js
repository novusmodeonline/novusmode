import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import prisma from "@/lib/prisma";
import {
  readGuestTokenCookie,
  hashGuestToken,
  clearGuestCookie,
  computeCartTotals,
} from "@/lib/cartOwnership";

const MAX_ITEM_QTY = 10;

/**
 * POST /api/cart/merge
 *
 * Transactional merge of guest cart into authenticated user's cart.
 * Called after login. Idempotent via MergeLedger.
 *
 * Algorithm:
 *  1. Must be authenticated.
 *  2. Read guest token from cookie → hash → find active guest cart.
 *  3. If no guest cart → no-op success.
 *  4. If no user cart → claim guest cart (re-assign ownership).
 *  5. If both exist → merge line items additively, cap quantities.
 *  6. Mark source guest cart "merged".
 *  7. Bump destination cart version.
 *  8. Record in MergeLedger for idempotency.
 *  9. Clear guest cookie only after successful commit.
 */
export async function POST() {
  try {
    // ── Auth gate ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Login required" },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    // ── Read guest token from cookie ──────────────────────────────────
    const rawToken = await readGuestTokenCookie();
    if (!rawToken) {
      // No guest cookie → nothing to merge
      return NextResponse.json({
        success: true,
        merged: false,
        cartVersion: 0,
        warnings: [],
      });
    }
    const guestTokenHash = hashGuestToken(rawToken);

    // ── Run merge inside a serialized transaction ─────────────────────
    // SQLite serialises writes, so this is safe from concurrent duplication.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find active guest cart
      const guestCart = await tx.cart.findFirst({
        where: { guestTokenHash, status: "active" },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!guestCart) {
        return {
          merged: false,
          cartVersion: 0,
          warnings: [],
          guestFound: false,
        };
      }

      // 2. Idempotency check — has this exact merge already happened?
      const existing = await tx.mergeLedger.findUnique({
        where: {
          userId_guestTokenHash_guestCartVersion: {
            userId,
            guestTokenHash,
            guestCartVersion: guestCart.version,
          },
        },
      });

      if (existing) {
        return {
          merged: true,
          cartVersion: existing.resultVersion,
          warnings: existing.warnings ?? [],
          guestFound: true,
          alreadyMerged: true,
        };
      }

      // 3. Find or prepare user cart
      let userCart = await tx.cart.findFirst({
        where: { userId, status: "active" },
        include: {
          items: { include: { product: true } },
        },
      });

      const warnings = [];

      // ── Case A: No user cart → claim guest cart ─────────────────────
      if (!userCart) {
        const claimed = await tx.cart.update({
          where: { id: guestCart.id },
          data: {
            userId,
            guestTokenHash: null,
            version: { increment: 1 },
            lastActivityAt: new Date(),
          },
        });

        await tx.mergeLedger.create({
          data: {
            userId,
            guestTokenHash,
            guestCartVersion: guestCart.version,
            resultCartId: claimed.id,
            resultVersion: claimed.version,
            warnings: [],
          },
        });

        return {
          merged: true,
          cartVersion: claimed.version,
          warnings: [],
          guestFound: true,
        };
      }

      // ── Case B: Both carts exist → merge line items ─────────────────
      // Build a map of user cart items keyed by (productId, selectedSize)
      const userItemMap = new Map();
      for (const item of userCart.items) {
        userItemMap.set(`${item.productId}::${item.selectedSize}`, item);
      }

      for (const guestItem of guestCart.items) {
        const key = `${guestItem.productId}::${guestItem.selectedSize}`;
        const product = guestItem.product;

        // Validate product is still available
        if (!product || product.inStock <= 0) {
          warnings.push({
            code: "OUT_OF_STOCK",
            productId: guestItem.productId,
            selectedSize: guestItem.selectedSize,
          });
          continue;
        }

        const existingUserItem = userItemMap.get(key);

        if (existingUserItem) {
          // Additive merge — user qty preserved first, guest qty added up to cap
          const combined = existingUserItem.quantity + guestItem.quantity;
          const capped = Math.min(combined, product.stockOnHand, MAX_ITEM_QTY);

          if (capped !== existingUserItem.quantity) {
            await tx.cartItem.update({
              where: { id: existingUserItem.id },
              data: {
                quantity: capped,
                unitPriceSnapshot: product.price,
              },
            });
          }

          if (capped < combined) {
            warnings.push({
              code: "QTY_CAPPED",
              productId: guestItem.productId,
              selectedSize: guestItem.selectedSize,
              requestedQty: combined,
              appliedQty: capped,
            });
          }
        } else {
          // New line item from guest cart
          const qty = Math.min(
            guestItem.quantity,
            product.stockOnHand,
            MAX_ITEM_QTY,
          );
          if (qty <= 0) {
            warnings.push({
              code: "OUT_OF_STOCK",
              productId: guestItem.productId,
              selectedSize: guestItem.selectedSize,
            });
            continue;
          }

          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              selectedSize: guestItem.selectedSize,
              quantity: qty,
              unitPriceSnapshot: product.price,
            },
          });

          if (qty < guestItem.quantity) {
            warnings.push({
              code: "QTY_CAPPED",
              productId: guestItem.productId,
              selectedSize: guestItem.selectedSize,
              requestedQty: guestItem.quantity,
              appliedQty: qty,
            });
          }
        }
      }

      // Mark guest cart as merged
      await tx.cart.update({
        where: { id: guestCart.id },
        data: { status: "merged" },
      });

      // Bump user cart version
      const updated = await tx.cart.update({
        where: { id: userCart.id },
        data: {
          version: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });

      // Record merge for idempotency
      await tx.mergeLedger.create({
        data: {
          userId,
          guestTokenHash,
          guestCartVersion: guestCart.version,
          resultCartId: userCart.id,
          resultVersion: updated.version,
          warnings: warnings.length > 0 ? warnings : [],
        },
      });

      return {
        merged: true,
        cartVersion: updated.version,
        warnings,
        guestFound: true,
      };
    });

    // ── Build response ─────────────────────────────────────────────────
    const res = NextResponse.json({
      success: true,
      merged: result.merged,
      cartVersion: result.cartVersion,
      warnings: result.warnings,
    });

    // Clear guest cookie only after successful commit
    if (result.guestFound) {
      clearGuestCookie(res);
    }

    return res;
  } catch (error) {
    console.error("POST /api/cart/merge error:", error);

    // Surface merge-in-progress as 409
    if (error.code === "P2034" || error.message?.includes("lock")) {
      return NextResponse.json(
        {
          code: "MERGE_IN_PROGRESS",
          message: "A merge is already in progress, please retry",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Merge failed" },
      { status: 500 },
    );
  }
}
