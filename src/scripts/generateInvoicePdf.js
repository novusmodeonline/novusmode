import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InvoiceTemplate from "../src/invoice/InvoiceTemplate.js";

const invoicePath = process.argv[2];
const invoice = JSON.parse(fs.readFileSync(invoicePath, "utf8"));

(async () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial }
        </style>
      </head>
      <body>
        ${renderToStaticMarkup(
          React.createElement(InvoiceTemplate, { oData: invoice })
        )}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const out = path.join(process.cwd(), "invoices");
  fs.mkdirSync(out, { recursive: true });

  await page.pdf({
    path: `${out}/${invoice.orderId}.pdf`,
    format: "A4",
    printBackground: true,
  });

  await browser.close();
})();
