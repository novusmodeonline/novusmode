"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function OrdersTable({ orders, page, totalPages }) {
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState(params.get("status") || "");
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");

  const applyFilters = () => {
    const q = new URLSearchParams();

    if (status) q.set("status", status);
    if (from) q.set("from", from);
    if (to) q.set("to", to);

    router.push(`/admin/orders?${q.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div>
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded w-40"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={applyFilters}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Apply Filters
        </button>
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
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.id}</td>
                <td>{o.status}</td>
                <td>₹{o.amount / 100}</td>
                <td>{o.email}</td>
                <td>{o.payment?.status || "-"}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
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
          onClick={() => router.push(`?page=${page - 1}`)}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => router.push(`?page=${page + 1}`)}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
