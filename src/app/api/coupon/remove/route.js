import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { getCartTotal } from "@/lib/cart";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 🔑 Always recalc cart from DB
    const cartTotal = await getCartTotal(session.user.id);

    return Response.json({
      success: true,
      originalAmount: cartTotal,
      discountAmount: 0,
      finalAmount: cartTotal,
    });
  } catch (err) {
    console.error("Remove coupon error:", err);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
