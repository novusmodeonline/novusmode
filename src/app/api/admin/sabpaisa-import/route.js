import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin-auth";
import { buildRealisticIndianPhone } from "@/lib/invoice/getMockAddress";
import { getRandomIndianName } from "@/lib/invoice/getInvoiceName";
import { pickProductsForInvoice } from "@/lib/invoice/productPicker";

function buildPlaceholderEmail(clientTxnId) {
  const localPart = String(clientTxnId || "external-order")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${localPart || "external-order"}@external-placeholder.local`;
}

function normalizeExternalOrderEmail(rawEmail, clientTxnId) {
  const email = String(rawEmail || "")
    .trim()
    .toLowerCase();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return email;
  }

  return buildPlaceholderEmail(clientTxnId);
}

function toIntAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
}

function normalizeImportStatus(rawStatus) {
  const normalized = String(rawStatus || "")
    .trim()
    .toUpperCase();

  if (normalized.includes("SUCCESS") || normalized.includes("CAPTURED")) {
    return {
      paymentStatus: "success",
      orderStatus: "paid",
      responseCode: "0000",
      responseMessage: "Payment successful",
      terminal: true,
    };
  }

  if (normalized.includes("ABORT")) {
    return {
      paymentStatus: "aborted",
      orderStatus: "failed",
      responseCode: "0200",
      responseMessage: "Payment aborted",
      terminal: true,
    };
  }

  if (normalized.includes("FAIL")) {
    return {
      paymentStatus: "failed",
      orderStatus: "failed",
      responseCode: "0300",
      responseMessage: "Payment failed",
      terminal: true,
    };
  }

  return {
    paymentStatus: "pending",
    orderStatus: "pending",
    responseCode: "0999",
    responseMessage: "Payment pending",
    terminal: false,
  };
}

async function pickRandomAddressId() {
  const addresses = await prisma.address.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (!addresses.length) {
    throw new Error("No addresses found. Seed Address data before import.");
  }

  const randomIndex = Math.floor(Math.random() * addresses.length);
  return addresses[randomIndex].id;
}

async function createExternalOrderFromImport(importRow, mappedStatus) {
  const orderId = importRow.orderId;
  const finalAmount = toIntAmount(importRow.paidAmount || importRow.amount);
  const fallbackName = getRandomIndianName().fullName;
  const payerName = String(importRow.payerName || fallbackName).trim() || fallbackName;
  const email = normalizeExternalOrderEmail(importRow.email, orderId);
  const phone = buildRealisticIndianPhone(
    `${orderId}-${importRow.mobile || importRow.email || payerName}-${finalAmount}`,
  );

  const addressId = await pickRandomAddressId();
  const isTestOrder = finalAmount < 200;
  const isFailedOrder =
    String(mappedStatus?.orderStatus || "").toLowerCase() === "failed";

  let originalAmount = finalAmount;
  let discountAmount = 0;
  let orderItems = [];

  if (!isTestOrder && !isFailedOrder) {
    const products = await prisma.product.findMany({
      where: { inStock: { gt: 0 } },
      select: {
        id: true,
        title: true,
        slug: true,
        mainImage: true,
        price: true,
        sizeMetric: true,
        defaultSize: true,
      },
    });

    if (products.length) {
      const picked = pickProductsForInvoice(finalAmount, products, {
        maxDiscount: 500,
      });

      orderItems = (picked.products || []).map((product) => ({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        mainImage: product.mainImage,
        price: product.price,
        quantity: product.qty || 1,
        selectedSize: product.defaultSize || null,
        sizeMetric: product.sizeMetric || null,
      }));

      const orderItemsTotal = Math.round(
        orderItems.reduce(
          (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
          0,
        ),
      );

      originalAmount = orderItemsTotal || finalAmount;
      discountAmount = Math.max(0, originalAmount - finalAmount);
    }
  }

  const createData = {
    id: orderId,
    userId: null,
    addressId,
    status: mappedStatus.orderStatus,
    amount: originalAmount,
    originalAmount,
    discountAmount,
    finalAmount,
    shippingAmount: 0,
    couponCode: isTestOrder ? "test-order" : null,
    email,
    phone,
    paymentMethod: "SABPAISA",
    source: "external",
    externalRefId: orderId,
    ...(importRow.parsedTxnDate ? { createdAt: importRow.parsedTxnDate } : {}),
  };

  if (orderItems.length) {
    createData.products = { create: orderItems };
  }

  return prisma.order.create({
    data: createData,
    include: {
      payment: true,
      products: true,
    },
  });
}

/**
 * Parse SabPaisa date string "YYYY-MM-DD HH:MM:SS" (always IST / UTC+5:30) → Date
 * Returns null if unparseable.
 */
function parseSabPaisaDate(str) {
  if (!str) return null;
  // Replace space with T and append IST offset so Date.parse treats it correctly
  const iso = str.trim().replace(" ", "T") + "+05:30";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getCell(row, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias];
    }
  }
  return null;
}

function parseImportRow(rawRow, rowNumber) {
  const orderId = String(
    getCell(rawRow, ["Client Trans ID", "Client Trans Id", "ClientTxnId"]) || "",
  ).trim();

  const amount = toIntAmount(getCell(rawRow, ["Amount"]));
  const paidAmount = toIntAmount(getCell(rawRow, ["Paid Amount", "PaidAmount"]));
  const paymentStatusRaw = String(
    getCell(rawRow, ["Payment Status", "Status"]) || "",
  ).trim();
  const transId = String(getCell(rawRow, ["Trans ID", "TransId"]) || "").trim();
  const rrn = String(getCell(rawRow, ["RRN / UTR", "RRN", "UTR"]) || "").trim();
  const paymentMode = String(getCell(rawRow, ["Payment Mode", "Mode"]) || "").trim();
  const email = String(getCell(rawRow, ["Payee Email", "Email"]) || "").trim();
  const mobile = String(
    getCell(rawRow, ["Payee Mob number", "Payee Mobile", "Mobile"]) || "",
  ).trim();
  const firstName = String(getCell(rawRow, ["Payee First Name", "First Name"]) || "").trim();
  const lastName = String(getCell(rawRow, ["Payee Last Name", "Last Name"]) || "").trim();
  const bankResponse = String(getCell(rawRow, ["Bank Response"]) || "").trim();
  const txnDate = String(getCell(rawRow, ["Transaction Date"]) || "").trim();
  const txnCompleteDate = String(
    getCell(rawRow, ["Transaction Complete Date"]) || "",
  ).trim();
  // Prefer complete date (when payment settled) over initiation date
  const parsedTxnDate =
    parseSabPaisaDate(txnCompleteDate) || parseSabPaisaDate(txnDate) || null;

  return {
    rowNumber,
    orderId,
    amount,
    paidAmount,
    paymentStatusRaw,
    transId,
    rrn,
    paymentMode,
    email,
    mobile,
    payerName: `${firstName} ${lastName}`.trim(),
    bankResponse,
    txnDate,
    txnCompleteDate,
    parsedTxnDate,
  };
}

async function upsertPaymentForImportedOrder(order, importRow, mappedStatus, dryRun) {
  const paymentAmount = toIntAmount(importRow.paidAmount || importRow.amount);
  const responseMessage =
    importRow.bankResponse || mappedStatus.responseMessage || importRow.paymentStatusRaw || null;

  const paymentData = {
    method: "SABPAISA",
    mode: importRow.paymentMode || null,
    status: mappedStatus.paymentStatus,
    amount: paymentAmount,
    gatewayId: importRow.transId || null,
    responseCode: mappedStatus.responseCode,
    responseMessage,
    payerName: importRow.payerName || null,
    rrn: importRow.rrn || null,
    rawResponse: {
      source: "sabpaisa-xlsx-import",
      rowNumber: importRow.rowNumber,
      paymentStatusRaw: importRow.paymentStatusRaw,
      transactionDate: importRow.txnDate || null,
      transactionCompleteDate: importRow.txnCompleteDate || null,
      bankResponse: importRow.bankResponse || null,
    },
    webhookVerified: true,
    webhookReceivedAt: new Date(),
    processedAt: mappedStatus.terminal ? new Date() : null,
    reconciliationRequired: !mappedStatus.terminal,
    reconciliationStatus: mappedStatus.terminal ? "not_required" : "required",
    lastReconciliationAt: mappedStatus.terminal ? new Date() : null,
  };

  if (dryRun) {
    return {
      paymentId: order.payment?.id || null,
      paymentStatus: paymentData.status,
      paymentAmount,
    };
  }

  const payment = await prisma.payment.upsert({
    where: { orderId: order.id },
    update: paymentData,
    create: {
      orderId: order.id,
      ...paymentData,
    },
  });

  await prisma.paymentAttempt.create({
    data: {
      paymentId: payment.id,
      direction: "inbound",
      endpoint: "sabpaisa-xlsx-import",
      statusCode: 200,
      request: importRow,
      response: {
        orderStatus: mappedStatus.orderStatus,
        paymentStatus: mappedStatus.paymentStatus,
        responseCode: mappedStatus.responseCode,
      },
      note: "sabpaisa-xlsx-import processed",
    },
  });

  return {
    paymentId: payment.id,
    paymentStatus: payment.status,
    paymentAmount: payment.amount,
  };
}

async function processImportRows(rows, dryRun, onProgress) {
  const results = [];
  let updatedOrders = 0;
  let createdOrders = 0;
  let failedRows = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const importRow = parseImportRow(rows[i], i + 2);

    if (!importRow.orderId) {
      failedRows += 1;
      results.push({
        rowNumber: importRow.rowNumber,
        orderId: null,
        ok: false,
        reason: "Missing Client Trans ID",
      });
    } else {
    try {
      const mappedStatus = normalizeImportStatus(importRow.paymentStatusRaw);

      let order = await prisma.order.findUnique({
        where: { id: importRow.orderId },
        include: { payment: true },
      });

      let created = false;

      if (!order) {
        created = true;
        createdOrders += 1;

        if (!dryRun) {
          order = await createExternalOrderFromImport(importRow, mappedStatus);
        }
      } else {
        updatedOrders += 1;

        if (!dryRun) {
          const finalAmount = toIntAmount(importRow.paidAmount || importRow.amount);

          order = await prisma.order.update({
            where: { id: importRow.orderId },
            data: {
              status: mappedStatus.orderStatus,
              amount: finalAmount,
              finalAmount,
              originalAmount: finalAmount,
              discountAmount: 0,
              paymentMethod: "SABPAISA",
              ...(importRow.parsedTxnDate ? { createdAt: importRow.parsedTxnDate } : {}),
            },
            include: { payment: true },
          });
        }
      }

      const paymentResult = await upsertPaymentForImportedOrder(
        order || { id: importRow.orderId, payment: null },
        importRow,
        mappedStatus,
        dryRun,
      );

      results.push({
        rowNumber: importRow.rowNumber,
        orderId: importRow.orderId,
        ok: true,
        action: created ? "created" : "updated",
        orderStatus: mappedStatus.orderStatus,
        paymentStatus: mappedStatus.paymentStatus,
        paymentAmount: paymentResult.paymentAmount,
      });
    } catch (error) {
      failedRows += 1;
      results.push({
        rowNumber: importRow.rowNumber,
        orderId: importRow.orderId,
        ok: false,
        reason: error?.message || "Failed to process row",
      });
    }
    } // end else (has orderId)

    if (onProgress) onProgress(i + 1, rows.length, importRow.orderId || null);
  }

  return {
    updatedOrders,
    createdOrders,
    failedRows,
    results,
  };
}

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    ok: true,
    endpoint: "/api/admin/sabpaisa-import",
    method: "POST",
    bodyType: "multipart/form-data",
    fields: {
      file: "SabPaisa xlsx file",
      mode: "dry-run | commit",
    },
  });
}

export async function POST(request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = String(formData.get("mode") || "dry-run").trim().toLowerCase();
    const dryRun = mode !== "commit";

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { ok: false, error: "Upload xlsx file in form-data field 'file'" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        { ok: false, error: "No worksheet found in uploaded xlsx" },
        { status: 400 },
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: false,
    });

    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "Uploaded xlsx is empty" },
        { status: 400 },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(obj) {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        }

        try {
          send({ type: "start", total: rows.length, sheetName });

          const processResult = await processImportRows(
            rows,
            dryRun,
            (current, total, orderId) => {
              send({ type: "progress", current, total, orderId });
            },
          );

          send({
            type: "complete",
            ok: true,
            mode: dryRun ? "dry-run" : "commit",
            sheetName,
            totalRows: rows.length,
            updatedOrders: processResult.updatedOrders,
            createdOrders: processResult.createdOrders,
            failedRows: processResult.failedRows,
            successRows: rows.length - processResult.failedRows,
            results: processResult.results,
          });
        } catch (streamError) {
          send({ type: "error", error: streamError?.message || "Processing failed" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to import SabPaisa xlsx",
      },
      { status: 500 },
    );
  }
}
