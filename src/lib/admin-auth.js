import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/scripts/authOptions";

async function safeGetServerSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    const message = String(error?.message || "Unknown session error");

    // During build/static analysis, Next may throw dynamic server usage errors.
    // Treat them as expected and avoid noisy logs.
    if (!message.includes("Dynamic server usage")) {
      console.error("[admin-auth] session parse failed", { message });
    }

    return null;
  }
}

export async function requireAdminApiSession() {
  const session = await safeGetServerSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
      session: null,
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      ),
      session: null,
    };
  }

  return { ok: true, response: null, session };
}

export async function requireAdminPageSession(callbackPath = "/admin/orders") {
  const session = await safeGetServerSession();

  if (!session?.user?.id) {
    const encoded = encodeURIComponent(callbackPath);
    redirect(`/login?callbackUrl=${encoded}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}
