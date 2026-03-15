// app/admin/orders/page.jsx
import { OrdersTable } from "@/components";

import { headers } from "next/headers";

async function getOrders(searchParams) {
  const headersList = await headers();

  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const query = new URLSearchParams(searchParams).toString();

  const url = `${protocol}://${host}/api/admin/orders?${query}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  return res.json();
}

export default async function OrdersPage({ searchParams }) {
  searchParams = await searchParams;
  const data = await getOrders(searchParams);

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
      />
    </div>
  );
}
