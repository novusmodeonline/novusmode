// app/admin/orders/page.jsx
import { OrdersTable } from "@/components";
import { headers } from "next/headers";

function getTodayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

async function getOrders(searchParams) {
  const headersList = await headers();
  const host = headersList.get("host");
  const cookie = headersList.get("cookie") || "";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const query = new URLSearchParams(searchParams).toString();
  const url = `${protocol}://${host}/api/admin/orders?${query}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie },
  });

  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export default async function OrdersPage({ searchParams }) {
  searchParams = await searchParams;

  const todayIST = getTodayIST();

  // Apply defaults when params are absent
  const effectiveParams = {
    ...(searchParams.orderId ? { orderId: searchParams.orderId } : {}),
    status: searchParams.status ?? "paid",
    from: searchParams.from ?? todayIST,
    to: searchParams.to ?? todayIST,
    ...(searchParams.page ? { page: searchParams.page } : {}),
  };

  const data = await getOrders(effectiveParams);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div className="flex gap-6 text-sm bg-gray-50 p-4 rounded">
        <div>
          <p className="text-gray-500">Total Transactions</p>
          <p className="font-semibold">{data.totalCount}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Amount</p>
          <p className="font-semibold">
            ₹{data.totalAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <OrdersTable
        orders={data.orders}
        page={data.page}
        totalPages={data.totalPages}
        totalCount={data.totalCount}
        currentOrderId={effectiveParams.orderId || ""}
        currentStatus={effectiveParams.status}
        currentFrom={effectiveParams.from}
        currentTo={effectiveParams.to}
        todayIST={todayIST}
      />
    </div>
  );
}
