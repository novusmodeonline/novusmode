import React from "react";
import { COMPANY } from "@/lib/static/company";

const sampleRows = [
  {
    sno: 1,
    description: "Sky Blue Polka Dot Shirt",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
  {
    sno: 2,
    description: "Soft Beige Textured Blouse",
    qty: 1,
    taxable: 238.1,
    gst: 5,
    gstAmt: 11.9,
    total: 250.0,
  },
  {
    sno: 3,
    description: "Mid Blue Bootcut Denim Jeans",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
  {
    sno: 4,
    description: "Olive Green Cotton Cargo Shorts",
    qty: 1,
    taxable: 285.71,
    gst: 5,
    gstAmt: 14.29,
    total: 300.0,
  },
  {
    sno: 5,
    description: "Pastel Pink Low-Top Sneakers",
    qty: 1,
    taxable: 380.95,
    gst: 5,
    gstAmt: 19.05,
    total: 400.0,
  },
  {
    sno: 6,
    description: "Coral Red Long-Sleeve Shirt",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
  {
    sno: 7,
    description: "Navy Blue Dial Mesh Strap Watch",
    qty: 1,
    taxable: 254.24,
    gst: 18,
    gstAmt: 45.76,
    total: 300.0,
  },
  {
    sno: 8,
    description: "Olive Green Wave Pattern Board Shorts",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
  {
    sno: 9,
    description: "White & Pastel Blue Striped T-Shirt",
    qty: 1,
    taxable: 238.1,
    gst: 5,
    gstAmt: 11.9,
    total: 250.0,
  },
  {
    sno: 10,
    description: "Turquoise V-Neck T-Shirt",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
  {
    sno: 11,
    description: "Coral Pink Crewneck T-Shirt",
    qty: 1,
    taxable: 285.71,
    gst: 5,
    gstAmt: 14.29,
    total: 300.0,
  },
  {
    sno: 12,
    description: "Geometric Green Pastel T-Shirt",
    qty: 1,
    taxable: 190.48,
    gst: 5,
    gstAmt: 9.52,
    total: 200.0,
  },
  {
    sno: 13,
    description: "Red and White Striped Full-Sleeve Shirt",
    qty: 1,
    taxable: 238.1,
    gst: 5,
    gstAmt: 11.9,
    total: 250.0,
  },
  {
    sno: 14,
    description: "Black Ballet Flats with Bow",
    qty: 1,
    taxable: 285.71,
    gst: 5,
    gstAmt: 14.29,
    total: 300.0,
  },
  {
    sno: 15,
    description: "Olive Green Full-Sleeve Cotton Shirt",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
  {
    sno: 16,
    description: "Light Blue Relaxed Fit Denim Jeans",
    qty: 1,
    taxable: 285.71,
    gst: 5,
    gstAmt: 14.29,
    total: 300.0,
  },
  {
    sno: 17,
    description: "Navy and Sky Blue Check Swim Shorts",
    qty: 1,
    taxable: 333.33,
    gst: 5,
    gstAmt: 16.67,
    total: 350.0,
  },
];

const formatMoney = (value) => `${"\u20B9"}${Number(value).toFixed(2)}`;

function formatDate(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function buildFallbackData() {
  const grandTotal = sampleRows.reduce(
    (sum, row) => sum + Number(row.total),
    0,
  );
  const totalTaxable = sampleRows.reduce(
    (sum, row) => sum + Number(row.taxable),
    0,
  );
  const totalGst = sampleRows.reduce((sum, row) => sum + Number(row.gstAmt), 0);
  const discount = 300;
  const payable = grandTotal - discount;

  return {
    invoiceNumber: "INV/2025-26/XIXLSU",
    orderId: "ORD-1767128082142-52021",
    orderDate: "2025-12-31T00:00:00.000Z",
    company: COMPANY,
    billingAddress: {
      name: "Ms. Kiran Saxena",
      address1: "Flat 601, HSR Layout Sector 2",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102",
      country: "India",
      stateCode: "29",
    },
    shippingAddress: {
      name: "Ms. Kiran Saxena",
      address1: "Flat 601, HSR Layout Sector 2",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102",
      country: "India",
      stateCode: "29",
    },
    items: sampleRows.map((row) => ({
      sno: row.sno,
      description: row.description,
      qty: row.qty,
      taxable: row.taxable,
      gst: row.gst,
      gstAmt: row.gstAmt,
      total: row.total,
    })),
    totals: {
      grandTotal,
      discount,
      payable,
      totalTaxable,
      totalGst,
      cgst: totalGst / 2,
      sgst: totalGst / 2,
    },
    payableText: "Rupees Five Thousand Only.",
  };
}

function normalizeAddress(address) {
  if (!address) return {};
  return {
    name: address.name || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
    country: address.country || "India",
    stateCode: address.stateCode || "",
  };
}

function buildInvoiceData(oData) {
  if (!oData || !Array.isArray(oData.items) || !oData.items.length) {
    return buildFallbackData();
  }

  return {
    ...oData,
    company: oData.company || COMPANY,
    billingAddress: normalizeAddress(oData.billingAddress),
    shippingAddress: normalizeAddress(oData.shippingAddress),
    totals: {
      grandTotal: Number(oData?.totals?.grandTotal || 0),
      discount: Number(oData?.totals?.discount || 0),
      payable: Number(oData?.totals?.payable || 0),
      totalTaxable: Number(oData?.totals?.totalTaxable || 0),
      totalGst: Number(
        oData?.totals?.totalGst ??
          Number(oData?.totals?.cgst || 0) + Number(oData?.totals?.sgst || 0),
      ),
      cgst: Number(oData?.totals?.cgst || 0),
      sgst: Number(oData?.totals?.sgst || 0),
    },
  };
}

function ItemsTable({ rows, showTotal = false, totals }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, width: "8%" }}>S.No</th>
          <th style={{ ...styles.th, width: "33%", textAlign: "left" }}>
            Description of Goods
          </th>
          <th style={{ ...styles.th, width: "7%" }}>Qty</th>
          <th style={{ ...styles.th, width: "15%" }}>Taxable Val</th>
          <th style={{ ...styles.th, width: "10%" }}>GST %</th>
          <th style={{ ...styles.th, width: "13%" }}>GST Amt</th>
          <th style={{ ...styles.th, width: "14%" }}>Total ({"\u20B9"})</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.sno}>
            <td
              style={{
                ...styles.td,
                ...styles.center,
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              {row.sno}
            </td>
            <td style={{ ...styles.td, fontWeight: 600, color: "#1f2937" }}>
              {row.description}
            </td>
            <td
              style={{
                ...styles.td,
                ...styles.center,
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              {row.qty}
            </td>
            <td
              style={{
                ...styles.td,
                ...styles.right,
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              {formatMoney(row.taxable)}
            </td>
            <td
              style={{
                ...styles.td,
                ...styles.center,
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              {row.gst}%
            </td>
            <td
              style={{
                ...styles.td,
                ...styles.right,
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              {formatMoney(row.gstAmt)}
            </td>
            <td style={{ ...styles.td, ...styles.right, fontWeight: 700 }}>
              {formatMoney(row.total)}
            </td>
          </tr>
        ))}

        {showTotal && (
          <tr>
            <td style={{ ...styles.totalCell, borderRight: 0 }} colSpan={5}>
              TOTAL
            </td>
            <td style={{ ...styles.totalCell, ...styles.right }}>
              {formatMoney(Number(totals?.totalGst || 0))}
            </td>
            <td style={{ ...styles.totalCell, ...styles.right }}>
              {formatMoney(Number(totals?.grandTotal || 0))}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function InvoicePageOne({ data, pageRows, showTableTotal }) {
  const company = data.company || COMPANY;
  const billing = data.billingAddress || {};
  const shipping = data.shippingAddress || {};

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerWrap}>
          <div style={styles.logoWrap}>
            <img
              src={company.logoImage}
              alt={company.name}
              style={styles.logoImage}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <p style={styles.companyName}>{company.name}</p>
            <p style={styles.metaLine}>
              <b>GSTIN:</b> {company.gstin}
            </p>
            <p style={styles.metaLine}>
              <b>Contact:</b> {company.contact || company.email} | <b>Web:</b>{" "}
              {company.website}
            </p>
          </div>
        </div>

        <div style={styles.titleRow}>TAX INVOICE</div>

        <div style={styles.infoGrid}>
          <div style={styles.infoBox}>
            <p style={styles.boxTitle}>ORDER DETAILS</p>
            <p style={styles.boxText}>
              <span>Order ID:</span> <b>{data.orderId}</b>
            </p>
            <p style={styles.boxText}>
              Order Date: {formatDate(data.orderDate)}
            </p>
            <p style={styles.boxText}>Invoice No: {data.invoiceNumber}</p>
          </div>

          <div style={styles.infoBox}>
            <p style={styles.boxTitle}>BILLING ADDRESS</p>
            <p style={{ ...styles.boxText, fontWeight: 700 }}>
              {billing.name || "-"}
            </p>
            <p style={styles.boxText}>{billing.address1 || "-"}</p>
            {billing.address2 ? (
              <p style={styles.boxText}>{billing.address2}</p>
            ) : null}
            <p style={styles.boxText}>
              {billing.city || ""} {billing.pincode || ""}
              {billing.state ? `, ${billing.state}` : ""}
            </p>
            <p style={styles.boxText}>{billing.country || "India"}</p>
            <p style={styles.boxText}>State Code: {billing.stateCode || "-"}</p>
          </div>

          <div style={styles.infoBox}>
            <p style={styles.boxTitle}>SHIPPING ADDRESS</p>
            <p style={{ ...styles.boxText, fontWeight: 700 }}>
              {shipping.name || "-"}
            </p>
            <p style={styles.boxText}>{shipping.address1 || "-"}</p>
            {shipping.address2 ? (
              <p style={styles.boxText}>{shipping.address2}</p>
            ) : null}
            <p style={styles.boxText}>
              {shipping.city || ""} {shipping.pincode || ""}
              {shipping.state ? `, ${shipping.state}` : ""}
            </p>
            <p style={styles.boxText}>{shipping.country || "India"}</p>
            <p style={styles.boxText}>
              State Code: {shipping.stateCode || "-"}
            </p>
          </div>
        </div>

        <ItemsTable
          rows={pageRows}
          showTotal={showTableTotal}
          totals={data.totals}
        />
      </div>
    </div>
  );
}

function InvoicePageTwo({ data, pageRows, showItemsTable }) {
  const company = data.company || COMPANY;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {showItemsTable ? (
          <ItemsTable rows={pageRows} showTotal totals={data.totals} />
        ) : null}

        <div style={styles.summaryWrap}>
          <div style={styles.taxBox}>
            <p style={styles.boxTitle}>TAX BREAKUP DETAILS</p>
            <div style={styles.kvRow}>
              <span style={{ color: "#dc2626" }}>Discount:</span>
              <b style={{ color: "#dc2626" }}>
                - {formatMoney(data.totals.discount)}
              </b>
            </div>
            <div style={styles.kvRow}>
              <span>Total Taxable Value:</span>
              <b>{formatMoney(data.totals.totalTaxable)}</b>
            </div>
            <div style={styles.kvRow}>
              <span>CGST (Central Tax):</span>
              <b>{formatMoney(data.totals.cgst)}</b>
            </div>
            <div style={styles.kvRow}>
              <span>SGST (State Tax):</span>
              <b>{formatMoney(data.totals.sgst)}</b>
            </div>
          </div>

          <div style={styles.payableBox}>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              TOTAL PAYABLE AMOUNT
            </p>
            <p style={{ margin: "8px 0 4px", fontSize: 28, fontWeight: 700 }}>
              {formatMoney(data.totals.payable)}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontStyle: "italic",
                opacity: 0.9,
              }}
            >
              {data.payableText ||
                `Rupees ${data.totals.payable.toLocaleString("en-IN")} Only.`}
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          <div>
            <p style={styles.footerHeading}>
              Legal Metrology & Manufacturer Declaration:
            </p>
            <p style={styles.footerText}>
              This package contains pre-packed garments. For any consumer
              complaints, contact our Nodal Officer at{" "}
              {company.nodalOfficeNumber || company.phone} or {company.email}.
              All prices are inclusive of GST as per Indian Law.
            </p>
            <p style={styles.footerHeading}>Return Policy:</p>
            <p style={styles.footerText}>
              Hassle-free returns within 15 days. Items must be unworn with all
              original tags intact.
            </p>
          </div>

          <div style={styles.signBlock}>
            <p
              style={{
                margin: 0,
                fontStyle: "italic",
                fontSize: 22,
                color: "#6b7280",
                fontWeight: 600,
              }}
            >
              For {company.name}
            </p>
            <div style={styles.signImages}>
              <img
                src={company.signatureImage}
                alt="signature"
                style={styles.signatureImage}
              />
              <img
                src={company.stampImage}
                alt="stamp"
                style={styles.stampImage}
              />
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 16,
                color: "#4b5563",
                fontWeight: 600,
              }}
            >
              {company.authorizedSignatory}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceTemplate({ oData }) {
  const data = buildInvoiceData(oData);
  const rows = data.items.map((item, index) => ({
    sno: index + 1,
    description: item.description,
    qty: item.qty,
    taxable: Number(item.taxable || 0),
    gst: Number(item.gst || 0),
    gstAmt: Number(item.gstAmt || 0),
    total: Number(item.total || 0),
  }));

  const firstPageRows = rows.slice(0, 13);
  const secondPageRows = rows.slice(13);
  const hasSecondPageRows = secondPageRows.length > 0;

  return (
    <div style={styles.root}>
      <InvoicePageOne
        data={data}
        pageRows={firstPageRows}
        showTableTotal={!hasSecondPageRows}
      />
      {hasSecondPageRows ? (
        <>
          <div style={{ pageBreakAfter: "always" }} />
          <InvoicePageTwo
            data={data}
            pageRows={secondPageRows}
            showItemsTable
          />
        </>
      ) : (
        <InvoicePageTwo data={data} pageRows={[]} showItemsTable={false} />
      )}
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "Arial, sans-serif",
    color: "#111827",
    background: "#efefef",
    padding: "20px 0",
  },
  page: {
    width: "100%",
    maxWidth: "980px",
    margin: "0 auto",
    padding: "20px",
    boxSizing: "border-box",
    background: "#efefef",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    padding: "34px 36px",
  },
  headerWrap: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 18,
  },
  logoWrap: {
    width: 210,
    height: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  companyName: {
    margin: "8px 0 10px",
    fontSize: 36,
    fontWeight: 700,
  },
  metaLine: {
    margin: "5px 0",
    fontSize: 24,
    color: "#374151",
  },
  titleRow: {
    margin: "20px 0",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center",
    padding: "10px 0",
    letterSpacing: 2,
    color: "#1f2937",
    fontSize: 20,
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 14,
    marginBottom: 20,
  },
  infoBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#f8fafc",
    padding: 14,
  },
  boxTitle: {
    margin: 0,
    fontSize: 14,
    color: "#64748b",
    fontWeight: 700,
    borderBottom: "1px solid #d1d5db",
    paddingBottom: 8,
    marginBottom: 8,
  },
  boxText: {
    margin: "3px 0",
    fontSize: 12,
    color: "#334155",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
    fontSize: 12,
  },
  th: {
    background: "#f1f5f9",
    border: "1px solid #e5e7eb",
    color: "#334155",
    padding: "10px 10px",
    fontWeight: 700,
    textAlign: "center",
  },
  td: {
    border: "1px solid #e5e7eb",
    padding: "9px 10px",
    verticalAlign: "top",
  },
  center: {
    textAlign: "center",
  },
  right: {
    textAlign: "right",
  },
  totalCell: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    fontWeight: 700,
    color: "#1f2937",
    padding: "11px 10px",
    textAlign: "center",
  },
  summaryWrap: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    alignItems: "stretch",
  },
  taxBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    background: "#fff",
  },
  kvRow: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #f1f5f9",
    padding: "7px 0",
    fontSize: 13,
    color: "#374151",
  },
  payableBox: {
    borderRadius: 10,
    padding: "18px 20px",
    background: "#1e293b",
    color: "#fff",
  },
  footer: {
    marginTop: 22,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 14,
  },
  footerHeading: {
    margin: "6px 0",
    fontSize: 18,
    fontWeight: 700,
    color: "#374151",
  },
  footerText: {
    margin: "3px 0",
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  signBlock: {
    marginTop: 14,
    textAlign: "right",
  },
  signImages: {
    position: "relative",
    display: "inline-block",
    width: 260,
    height: 150,
    marginTop: 8,
  },
  signatureImage: {
    position: "absolute",
    right: 12,
    bottom: 10,
    width: 230,
    height: 110,
    objectFit: "contain",
    zIndex: 1,
  },
  stampImage: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 130,
    height: 130,
    objectFit: "contain",
    zIndex: 2,
  },
};
