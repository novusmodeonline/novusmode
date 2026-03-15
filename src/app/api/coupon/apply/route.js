import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { PrismaClient } from "@prisma/client";
import { getCartTotal } from "@/lib/cart";
import { applyCouponRule } from "@/lib/couponRules";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { couponCode } = await req.json();
    if (!couponCode) {
      return Response.json(
        { success: false, message: "Coupon code required" },
        { status: 400 }
      );
    }

    const normalizedCode = couponCode.trim().toUpperCase();

    // 🔑 Fetch coupon from DB
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon || !coupon.isActive) {
      return Response.json(
        { success: false, message: "Invalid coupon code" },
        { status: 400 }
      );
    }

    // 🔑 Get authoritative cart total
    const cartTotal = await getCartTotal(session.user.id);
    // 🎯 Apply rule from code
    const result = applyCouponRule(coupon.ruleType, cartTotal);

    if (!result.valid) {
      return Response.json(
        { success: false, message: "Coupon cannot be applied" },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      couponCode: coupon.code,
      originalAmount: cartTotal,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    });
  } catch (err) {
    console.error("Coupon apply error:", err);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
