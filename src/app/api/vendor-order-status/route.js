import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: "Unauthorized" },
    { status: 401 },
  );
}

export async function GET(request) {
  try {
    const auth = request.headers.get("authorization");

    if (!auth || auth !== `Bearer ${process.env.VENDOR_API_KEY}`) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "id is required",
        },
        {
          status: 400,
        },
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        gatewayOrderId: id,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return NextResponse.json({
        ok: false,
        found: false,
        message: "Payment not found in database",
      });
    }

    return NextResponse.json({
      resultCode: payment.responseCode || "000",
      resultStatus:
        payment.status === "success"
          ? "success"
          : payment.status === "failed"
            ? "failed"
            : "pending",
      resultMessage: payment.responseMessage || "",
      data: {
        msgId: payment.gatewayId,
        rrn: payment.rrn,
        refId: payment.gatewayOrderId,
        payerName: payment.payerName,
        payerAddress: payment.payerAddress,
        amount: String(payment.amount),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
