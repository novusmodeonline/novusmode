import { FaCircleQuestion } from "react-icons/fa6";
import Link from "next/link";
import { shippingCharges } from "@/helper/common";
import { useCouponStore } from "@/app/_zustand/useCouponStore";

const SHIPPING_ENABLED = ["1", "true", "yes", "on"].includes(
  String(process.env.NEXT_PUBLIC_SABPAISA_SHIPPING_ENABLED || "")
    .trim()
    .toLowerCase(),
);

const OrderSummary = ({ total, products, mode, makePurchase, state }) => {
  const { appliedCoupon, discountAmount, finalAmount } = useCouponStore();

  // 🔑 Decide payable subtotal
  const effectiveSubtotal = appliedCoupon ? finalAmount : total;
  let shipping = 0;
  if (
    SHIPPING_ENABLED &&
    effectiveSubtotal > 0 &&
    typeof state === "string" &&
    state.trim()
  ) {
    const calculatedShipping = shippingCharges(state, effectiveSubtotal);
    if (Number.isFinite(calculatedShipping) && calculatedShipping > 0) {
      shipping = calculatedShipping;
    }
  }
  const orderTotal =
    effectiveSubtotal === 0 ? 0 : Math.round(effectiveSubtotal + shipping);

  return (
    <section
      aria-labelledby="summary-heading"
      className="mt-16 lg:mt-0 lg:col-span-5"
    >
      <div className="sticky top-24 min-h-[380px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-6" id="summary-heading">
            Order summary
          </h2>

          <dl className="space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between">
              <dt className="text-sm">Subtotal</dt>
              <dd className="text-sm font-semibold">₹{total.toFixed(2)}</dd>
            </div>

            {/* Coupon discount */}
            {appliedCoupon && discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt className="text-sm">Coupon ({appliedCoupon})</dt>
                <dd className="text-sm font-semibold">
                  -₹{discountAmount.toFixed(2)}
                </dd>
              </div>
            )}

            {/* Shipping */}
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <dt className="flex items-center text-sm">
                Shipping estimate
                <FaCircleQuestion className="ml-2 h-4 w-4 text-gray-400" />
              </dt>
              <dd className="text-sm font-semibold">₹{shipping.toFixed(2)}</dd>
            </div>

            {/* Final total */}
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-bold">Order total</dt>
              <dd className="text-base font-bold">₹{orderTotal.toFixed(2)}</dd>
            </div>
          </dl>
        </div>

        {products.length > 0 && (
          <div className="mt-6">
            {mode === "checkout" ? (
              <button
                type="button"
                onClick={makePurchase}
                className="w-full rounded-md border border-transparent bg-[color:var(--color-bg)] px-6 py-3 text-lg font-medium text-white hover:opacity-90"
              >
                Pay Now
              </button>
            ) : (
              <Link
                href="/checkout"
                className="block w-full text-center border border-[var(--color-bg)] text-[var(--color-bg)] font-semibold py-3 rounded-md hover:bg-[var(--color-bg)] hover:text-white transition"
              >
                CHECKOUT
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderSummary;
