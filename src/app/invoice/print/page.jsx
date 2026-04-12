import InvoiceTemplate from "@/invoice/InvoiceTemplate";

export const dynamic = "force-dynamic";

function decodeInvoiceData(rawData) {
  if (!rawData) return null;

  try {
    const decoded = Buffer.from(decodeURIComponent(rawData), "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default async function InvoicePrintPage({ searchParams }) {
  const params = await searchParams;
  const invoiceData = decodeInvoiceData(params?.data);

  return (
    <div className="invoice-print-root">
      <InvoiceTemplate oData={invoiceData || undefined} />
    </div>
  );
}
