import { headers } from "next/headers";

async function getExternalSyncLogs(searchParams) {
  const headersList = await headers();
  const host = headersList.get("host");
  const cookie = headersList.get("cookie") || "";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const query = new URLSearchParams(searchParams).toString();
  const url = `${protocol}://${host}/api/admin/external-order-sync?${query}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch external order sync logs");
  }

  return res.json();
}

function renderBool(value) {
  if (value === null || value === undefined) return "-";
  return value ? "Yes" : "No";
}

export default async function ExternalOrderSyncPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const data = await getExternalSyncLogs(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">External Order Sync Logs</h2>
        <p className="text-sm text-gray-600">
          One final status row per processed order.
        </p>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Order ID</th>
              <th className="px-3 py-2">Batch ID</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Exists in SabPaisa</th>
              <th className="px-3 py-2">Forwarded</th>
              <th className="px-3 py-2">Vendor Code</th>
              <th className="px-3 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {data.logs?.map((log) => (
              <tr key={log.id} className="border-t align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{log.orderId}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {log.batchId || "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{log.status}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {renderBool(log.existsInSabPaisa)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {renderBool(log.forwardedToVendor)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {log.vendorStatusCode ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-pre-wrap">
                  {log.message || "-"}
                </td>
              </tr>
            ))}
            {!data.logs?.length && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        Page {data.page} of {data.totalPages} | Total logs: {data.totalCount}
      </div>
    </div>
  );
}
