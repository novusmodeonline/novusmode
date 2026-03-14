import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { applyCouponRule } from "@/lib/couponRules";
import { shippingCharges } from "@/helper/common";

function generateOrderId() {
  const timestamp = Date.now(); // ms since epoch
  const random = Math.floor(10000 + Math.random() * 90000); // 5-digit

  return `ORD-${timestamp}-${random}`;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();

    const {
      orderId, // optional
      contact,
      address,
      products, // UI list (NOT trusted for pricing)
      couponCode, // coupon intent only
    } = body;

    if (
      !contact?.email ||
      !contact?.phone ||
      !address?.address1 ||
      !address?.city ||
      !address?.state ||
      !address?.pincode
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ------------------ FETCH CART FROM DB (SOURCE OF TRUTH) ------------------ */

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    /* ------------------ CALCULATE ORIGINAL AMOUNT ------------------ */

    const finalOrderId = orderId || generateOrderId();
    let originalAmount = 0;

    cart.items.forEach((item) => {
      originalAmount += Math.round(item.product.price * item.quantity);
    });

    /* ------------------ APPLY COUPON (AUTHORITATIVE) ------------------ */

    let discountAmount = 0;
    let finalAmount = originalAmount;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive) {
        const result = applyCouponRule(coupon.ruleType, originalAmount);

        if (result.valid) {
          discountAmount = result.discountAmount;
          finalAmount = result.finalAmount;
          appliedCouponId = coupon.id;
          appliedCouponCode = coupon.code;
        }
      }
    }



    /* ------------------ SHIPPING CALCULATION ------------------ */

    const shippingAmount =
      finalAmount >= 500 ? 0 : shippingCharges(address.state, finalAmount);

    const payableAmount = finalAmount + shippingAmount;

    /* ------------------ DEFAULT ADDRESS RULE ------------------ */

    if (address.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    /* ------------------ SAVE / UPDATE ADDRESS ------------------ */

    let savedAddress;

    if (address.id) {
      savedAddress = await prisma.address.update({
        where: { id: address.id },
        data: {
          address1: address.address1,
          address2: address.address2 || null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: "India",
          landmark: address.landmark || null,
          label: address.label || "HOME",
          isDefault: address.isDefault || false,
          userId,
        },
      });
    } else {
      savedAddress = await prisma.address.create({
        data: {
          name: contact.name,
          phone: contact.phone,
          address1: address.address1,
          address2: address.address2 || null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: "India",
          landmark: address.landmark || null,
          label: address.label || "HOME",
          isDefault: address.isDefault || false,
          userId,
        },
      });
    }

    /* ------------------ UPSERT ORDER ------------------ */

    const order = await prisma.order.upsert({
      where: { id: finalOrderId },

      update: {
        addressId: savedAddress.id,
        email: contact.email,
        phone: contact.phone,

        originalAmount,
        discountAmount,
        finalAmount,
        shippingAmount,

        couponId: appliedCouponId,
        couponCode: appliedCouponCode,

        updatedAt: new Date(),
      },

      create: {
        id: finalOrderId,
        userId,
        addressId: savedAddress.id,
        status: "pending",

        email: contact.email,
        phone: contact.phone,
        amount: originalAmount,
        originalAmount,
        discountAmount,
        finalAmount,
        shippingAmount,

        couponId: appliedCouponId,
        couponCode: appliedCouponCode,

        products: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            title: item.product.title,
            slug: item.product.slug,
            mainImage: item.product.mainImage,
            price: item.product.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize || null,
            sizeMetric: item.product.sizeMetric || null,
          })),
        },
      },

      include: {
        products: true,
        address: true,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      payableAmount,
      order,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 },
      { orderId: finalOrderId }
    );
  }
}
