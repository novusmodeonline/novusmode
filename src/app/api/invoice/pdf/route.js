export const runtime = "nodejs";

import puppeteer from "puppeteer";

export async function POST(req) {
  const invoice = await req.json(); // ✅ FULL invoice object

  const encoded = encodeURIComponent(
    Buffer.from(JSON.stringify(invoice)).toString("base64")
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const printUrl = `${baseUrl}/invoice/print?data=${encoded}`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(printUrl, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.invoice}.pdf`,
    },
  });
}
