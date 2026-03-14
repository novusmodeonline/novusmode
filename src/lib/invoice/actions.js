"use server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

export async function generateInvoicePdf(invoice) {
  const tempDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tempDir, { recursive: true });

  const jsonPath = path.join(tempDir, `${invoice.orderId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(invoice));

  exec(`node scripts/generateInvoicePdf.js ${jsonPath}`);
}
