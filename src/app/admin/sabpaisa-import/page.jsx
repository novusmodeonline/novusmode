"use client";

import { useMemo, useState } from "react";

function StatusPill({ ok }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {ok ? "ok" : "failed"}
    </span>
  );
}

export default function SabPaisaImportPage() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("dry-run");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [lastRunAt, setLastRunAt] = useState("");
  const [progress, setProgress] = useState(null); // { current, total } | null

  const summary = useMemo(() => {
    if (!result) return null;
    return [
      { label: "Mode", value: result.mode },
      { label: "Sheet", value: result.sheetName },
      { label: "Total Rows", value: result.totalRows },
      { label: "Success Rows", value: result.successRows },
      { label: "Failed Rows", value: result.failedRows },
      { label: "Updated Orders", value: result.updatedOrders },
      { label: "Created Orders", value: result.createdOrders },
    ];
  }, [result]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setProgress(null);

    if (!file) {
      setError("Please choose an xlsx file.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("/api/admin/sabpaisa-import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let data = null;
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { ok: false, error: text || "Unexpected non-JSON response from server" };
        }
        const statusPrefix = `${res.status}${res.statusText ? ` ${res.statusText}` : ""}`;
        throw new Error(`${statusPrefix}: ${data?.error || "Import request failed"}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed);
            if (evt.type === "start") {
              setProgress({ current: 0, total: evt.total });
            } else if (evt.type === "progress") {
              setProgress({ current: evt.current, total: evt.total });
            } else if (evt.type === "complete") {
              setResult(evt);
              setLastRunAt(new Date().toLocaleString("en-IN"));
              setProgress(null);
            } else if (evt.type === "error") {
              throw new Error(evt.error);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr;
          }
        }
      }
    } catch (submitError) {
      setError(submitError?.message || "Unable to import xlsx file");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">SabPaisa XLSX Import</h2>
        <p className="text-sm text-gray-600">
          Upload transaction history and reconcile orders in bulk.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white border rounded-lg p-4 space-y-4"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium">XLSX File</label>
            <input
              type="file"
              accept=".xlsx"
              required
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Mode</label>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="dry-run">dry-run (no DB write)</option>
              <option value="commit">commit (write to DB)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
          >
          {loading ? (
            progress ? `Processing row ${progress.current} of ${progress.total}…` : "Uploading…"
          ) : "Run Import"}
          </button>
          {file && <span className="text-xs text-gray-600">{file.name}</span>}
        </div>

        {loading && progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Row {progress.current} of {progress.total} processed</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {loading && !progress && (
          <p className="text-xs text-gray-500">Uploading and reading file…</p>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {error}
            {error.includes("401") || error.includes("403")
              ? " | Please login again with ADMIN account on the same host/port."
              : ""}
          </p>
        )}
        {lastRunAt && !error && (
          <p className="text-xs text-gray-600">Last run: {lastRunAt}</p>
        )}
      </form>

      {summary && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {summary.map((item) => (
              <div key={item.label} className="bg-gray-50 rounded p-3">
                <p className="text-gray-500">{item.label}</p>
                <p className="font-semibold break-all">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.results?.length ? (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Order Status</th>
                <th className="px-3 py-2">Payment Status</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((item, index) => (
                <tr
                  key={`${item.rowNumber}-${item.orderId || "none"}-${index}`}
                  className="border-t"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.rowNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.orderId || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <StatusPill ok={Boolean(item.ok)} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.action || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.orderStatus || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.paymentStatus || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.paymentAmount ?? "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap">
                    {item.reason || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
