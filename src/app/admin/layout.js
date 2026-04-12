import Link from "next/link";
import { requireAdminPageSession } from "@/lib/admin-auth";

export default async function AdminLayout({ children }) {
  await requireAdminPageSession("/admin/orders");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header className="bg-white border rounded-lg p-4">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <nav className="mt-3 flex gap-3 text-sm">
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
            >
              Orders
            </Link>
            <Link
              href="/admin/external-order-sync"
              className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
            >
              External Sync Logs
            </Link>
            <Link
              href="/admin/sabpaisa-import"
              className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
            >
              SabPaisa Import
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
