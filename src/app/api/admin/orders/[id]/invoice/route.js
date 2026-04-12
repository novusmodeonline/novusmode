import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin-auth";
import { COMPANY } from "@/lib/static/company";
import { GST_BY_SUBCATEGORY } from "@/lib/invoice/gstMap";
import { generateInvoiceNumber } from "@/lib/invoice/invoiceUtils";

export const runtime = "nodejs";

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeItemTax(totalInclusive, gstRate) {
  const rate = safeNumber(gstRate, 0);
  if (rate <= 0) {
    return {
      taxable: round2(totalInclusive),
      gstAmt: 0,
    };
  }

  const taxable = round2((safeNumber(totalInclusive) * 100) / (100 + rate));
  const gstAmt = round2(safeNumber(totalInclusive) - taxable);

  return { taxable, gstAmt };
}

function buildPayableText(payable) {
  return `Rupees ${safeNumber(payable).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Only.`;
}

function stateCodeFromCompanyGstin() {
  const code = String(COMPANY.gstin || "").slice(0, 2);
  return /^\d{2}$/.test(code) ? code : "";
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function pickCustomerName(order) {
  const userName = String(order?.user?.name || "").trim();
  const payerName = String(order?.payment?.payerName || "").trim();
  const addressName = String(order?.address?.name || "").trim();
  const addressLine1 = String(order?.address?.address1 || "").trim();

  if (userName) return userName;
  if (payerName) return payerName;

  // Some imported rows accidentally store address text in name field.
  if (addressName && normalizeText(addressName) !== normalizeText(addressLine1)) {
    return addressName;
  }

  const emailLocalPart = String(order?.email || "").split("@")[0] || "";
  return emailLocalPart || "Customer";
}

export async function GET(request, context) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const routeParams = await context?.params;
  const orderId = routeParams?.id;
  if (!orderId) {
    return Response.json({ ok: false, error: "Order id is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      address: true,
      payment: true,
      products: {
        include: {
          product: {
            include: {
              subCategory: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const items = (order.products || []).map((item, index) => {
    const qty = Math.max(1, safeNumber(item.quantity, 1));
    const unitPrice = safeNumber(item.price, 0);
    const total = round2(unitPrice * qty);

    const subCategorySlug = String(
      item?.product?.subCategory?.slug || "",
    ).toLowerCase();
    const gst = safeNumber(GST_BY_SUBCATEGORY[subCategorySlug], 5);

    const { taxable, gstAmt } = computeItemTax(total, gst);

    return {
      sno: index + 1,
      description: item.title,
      qty,
      taxable,
      gst,
      gstAmt,
      total,
    };
  });

  const grandTotal = round2(items.reduce((sum, item) => sum + safeNumber(item.total), 0));
  const totalTaxable = round2(items.reduce((sum, item) => sum + safeNumber(item.taxable), 0));
  const totalGst = round2(items.reduce((sum, item) => sum + safeNumber(item.gstAmt), 0));

  const discount = round2(safeNumber(order.discountAmount, 0));
  const payable = round2(safeNumber(order.finalAmount ?? order.amount ?? grandTotal, grandTotal));

  const invoiceDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
  const invoiceNumber = generateInvoiceNumber(order.id, invoiceDate);
  const customerName = pickCustomerName(order);

  const invoiceData = {
    invoiceNumber,
    orderId: order.id,
    orderDate: order.createdAt,
    company: COMPANY,
    billingAddress: {
      name: customerName,
      address1: order.address?.address1 || "",
      address2: order.address?.address2 || "",
      city: order.address?.city || "",
      state: order.address?.state || "",
      pincode: order.address?.pincode || "",
      country: order.address?.country || "India",
      stateCode: stateCodeFromCompanyGstin(),
    },
    shippingAddress: {
      name: customerName,
      address1: order.address?.address1 || "",
      address2: order.address?.address2 || "",
      city: order.address?.city || "",
      state: order.address?.state || "",
      pincode: order.address?.pincode || "",
      country: order.address?.country || "India",
      stateCode: stateCodeFromCompanyGstin(),
    },
    items,
    totals: {
      grandTotal,
      discount,
      payable,
      totalTaxable,
      totalGst,
      cgst: round2(totalGst / 2),
      sgst: round2(totalGst / 2),
    },
    payableText: buildPayableText(payable),
    payment: {
      status: order.payment?.status || null,
      mode: order.payment?.mode || null,
      gatewayId: order.payment?.gatewayId || null,
      rrn: order.payment?.rrn || null,
    },
  };

  const encoded = encodeURIComponent(
    Buffer.from(JSON.stringify(invoiceData)).toString("base64"),
  );
  const printUrl = `${request.nextUrl.origin}/invoice/print?data=${encoded}`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const fileSafeOrderId = String(order.id || orderId).replace(/[^a-zA-Z0-9-_]/g, "-");

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${fileSafeOrderId}.pdf`,
      },
    });
  } finally {
    await browser.close();
  }
}
