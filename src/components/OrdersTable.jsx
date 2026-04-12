"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getYesterdayIST(todayIST) {
  const d = new Date(todayIST + "T00:00:00+05:30");
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, day] = dateStr.split("-");
  return `${day}/${m}/${y}`;
}

export default function OrdersTable({
  orders,
  page,
  totalPages,
  currentOrderId,
  currentStatus,
  currentFrom,
  currentTo,
  todayIST,
}) {
  const router = useRouter();
  const yesterdayIST = getYesterdayIST(todayIST);

  function detectPreset(from, to) {
    if (from === todayIST && to === todayIST) return "today";
    if (from === yesterdayIST && to === yesterdayIST) return "yesterday";
    return "custom";
  }

  const [status, setStatus] = useState(currentStatus || "paid");
  const [orderId, setOrderId] = useState(currentOrderId || "");
  const [datePreset, setDatePreset] = useState(
    detectPreset(currentFrom, currentTo),
  );
  const [customFrom, setCustomFrom] = useState(currentFrom || todayIST);
  const [customTo, setCustomTo] = useState(currentTo || todayIST);
  const [downloadingOrderId, setDownloadingOrderId] = useState("");

  function push(overrides = {}, options = {}) {
    const nextOrderId = (overrides.orderId ?? orderId).trim();
    const navigationMode = options.navigationMode || "push";
    const base = {
      status,
      from: datePreset === "today"
        ? todayIST
        : datePreset === "yesterday"
          ? yesterdayIST
          : customFrom,
      to: datePreset === "today"
        ? todayIST
        : datePreset === "yesterday"
          ? yesterdayIST
          : customTo,
      orderId: nextOrderId,
      ...overrides,
    };

    const q = new URLSearchParams();
    if (base.orderId) {
      q.set("orderId", base.orderId);
    }
    if (base.status && base.status !== "all") q.set("status", base.status);
    if (base.from) q.set("from", base.from);
    if (base.to) q.set("to", base.to);

    router[navigationMode](`/admin/orders?${q.toString()}`);
  }

  function applyPreset(preset) {
    setDatePreset(preset);
    const from =
      preset === "today"
        ? todayIST
        : preset === "yesterday"
          ? yesterdayIST
          : customFrom;
    const to =
      preset === "today"
        ? todayIST
        : preset === "yesterday"
          ? yesterdayIST
          : customTo;

    const q = new URLSearchParams();
    if (orderId.trim()) q.set("orderId", orderId.trim());
    if (status && status !== "all") q.set("status", status);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    router.push(`/admin/orders?${q.toString()}`);
  }

  useEffect(() => {
    setOrderId(currentOrderId || "");
  }, [currentOrderId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedOrderId = orderId.trim();
      const trimmedCurrentOrderId = (currentOrderId || "").trim();

      if (trimmedOrderId === trimmedCurrentOrderId) {
        return;
      }

      push(
        { orderId: trimmedOrderId, page: 1 },
        { navigationMode: "replace" },
      );
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [orderId, currentOrderId]);

  async function downloadInvoice(orderIdToDownload) {
    try {
      setDownloadingOrderId(orderIdToDownload);

      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderIdToDownload)}/invoice`,
      );

      if (!res.ok) {
        throw new Error(`Invoice download failed (${res.status})`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename=([^;]+)/i);
      const fileName = (fileNameMatch?.[1] || `${orderIdToDownload}.pdf`).replace(/"/g, "");

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error?.message || "Unable to download invoice");
    } finally {
      setDownloadingOrderId("");
    }
  }

  const presetBtnClass = (active) =>
    `px-3 py-1.5 rounded text-sm border transition-colors ${
      active
        ? "bg-black text-white border-black"
        : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
    }`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 min-w-[260px]">
            <label className="text-xs font-medium text-gray-600 block">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Search order id"
              className="border rounded px-3 py-1.5 text-sm w-full"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 block">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm min-w-[120px]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date presets */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 block">
              Date
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={presetBtnClass(datePreset === "today")}
                onClick={() => applyPreset("today")}
              >
                Today ({formatDateLabel(todayIST)})
              </button>
              <button
                type="button"
                className={presetBtnClass(datePreset === "yesterday")}
                onClick={() => applyPreset("yesterday")}
              >
                Yesterday ({formatDateLabel(yesterdayIST)})
              </button>
              <button
                type="button"
                className={presetBtnClass(datePreset === "custom")}
                onClick={() => setDatePreset("custom")}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Apply for status changes or when preset is already set */}
          <button
            type="button"
            onClick={() => push()}
            className="px-4 py-1.5 rounded bg-black text-white text-sm self-end"
          >
            Apply Filters
          </button>
        </div>

        {/* Custom date range */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap gap-3 items-end pt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 block">
                From
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 block">
                To
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => push()}
              className="px-4 py-1.5 rounded bg-black text-white text-sm"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Order ID</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Email</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.id}</td>
                <td className="px-3 py-2 text-center">{o.status}</td>
                <td className="px-3 py-2 text-center">
                  ₹{(o.finalAmount ?? o.amount ?? 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2 text-center">{o.email}</td>
                <td className="px-3 py-2 text-center">
                  {o.payment?.status || "-"}
                </td>
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td className="px-3 py-2 text-center">
                  {String(o.status || "").toLowerCase() === "paid" ? (
                    <button
                      type="button"
                      onClick={() => downloadInvoice(o.id)}
                      disabled={downloadingOrderId === o.id}
                      className="px-3 py-1.5 rounded bg-black text-white text-xs disabled:opacity-60"
                    >
                      {downloadingOrderId === o.id ? "Generating..." : "Invoice"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          disabled={page <= 1}
          onClick={() => push({ page: page - 1 })}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => push({ page: page + 1 })}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
