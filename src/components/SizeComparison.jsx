import { getSizeChartForProduct, parseSizes } from "@/lib/sizecharts";

function SizeComparison({ open, onClose, product }) {
  if (!open) return null;

  const chart = getSizeChartForProduct(product);
  // chart = { kind, metric, group?, headers: [...], rows: [...] }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-lg w-full max-w-xl shadow-lg">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            Size chart {product.sizeMetric ? `(${product.sizeMetric})` : ""}
          </h2>
          <button onClick={onClose} className="text-sm px-2 py-1">
            ✕
          </button>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                {chart.headers.map((h) => (
                  <th key={h} className="py-2 pr-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.length > 0 ? (
                chart.rows.map((r) => (
                  <tr key={r.size} className="border-b">
                    {/* apparel rows may have nulls depending on group */}
                    {chart.kind === "shoes" ? (
                      <>
                        <td className="py-2 pr-3">{r.size}</td>
                        <td className="py-2 pr-3">{r.us}</td>
                        <td className="py-2 pr-3">{r.uk}</td>
                        <td className="py-2 pr-3">{r.eu}</td>
                      </>
                    ) : chart.group === "top" ? (
                      <>
                        <td className="py-2 pr-3">{r.size}</td>
                        {chart.metric === "EU" ? (
                          <>
                            <td className="py-2 pr-3">
                              {(r.chestCm || r.bustCm) ?? "-"}
                            </td>
                            <td className="py-2 pr-3">
                              {(r.waistCm || r.lengthCm) ?? "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-3">
                              {(r.chestIn || r.bustIn) ?? "-"}
                            </td>
                            <td className="py-2 pr-3">
                              {(r.waistIn || r.lengthIn) ?? "-"}
                            </td>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-3">{r.size}</td>
                        {chart.metric === "EU" ? (
                          <>
                            <td className="py-2 pr-3">{r.waistCm ?? "-"}</td>
                            <td className="py-2 pr-3">{r.hipCm ?? "-"}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-3">{r.waistIn ?? "-"}</td>
                            <td className="py-2 pr-3">{r.hipIn ?? "-"}</td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="py-6 text-center text-gray-500"
                    colSpan={chart.headers.length}
                  >
                    No size data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="text-xs text-gray-600 mt-3">
            Tip: if you’re between sizes, choose the larger for a relaxed fit.
          </p>
        </div>

        <div className="px-5 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded border text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SizeComparison;
