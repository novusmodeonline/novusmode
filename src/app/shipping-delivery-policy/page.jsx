// app/shipping-delivery-policy/page.jsx

export const metadata = {
  title: "Shipping & Delivery Policy | NovusMode",
  description:
    "Read our detailed Shipping & Delivery Policy to learn about delivery timelines, shipping charges, order tracking, and international delivery options at NovusMode.",
};

export default function ShippingDeliveryPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8 md:p-12 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-gray-500 text-sm">
          Last Updated: <strong>28/10/2025</strong>
        </p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Welcome to <strong>NovusMode</strong>! We aim to provide a smooth
            and reliable shopping experience by ensuring timely delivery of your
            orders. This Shipping &amp; Delivery Policy explains how we handle
            shipping, delivery times, order tracking, and other related details.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            1. Shipping Coverage
          </h2>
          <p>
            We currently ship across all major cities and towns in India through
            trusted courier partners such as Delhivery, Blue Dart, DTDC, and
            India Post. We also offer international delivery to select countries
            — please contact our support team before placing an international
            order.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            2. Processing Time
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Orders are processed within <strong>1–3 business days</strong>{" "}
              after payment confirmation (excluding weekends and public
              holidays).
            </li>
            <li>
              Orders placed after 5 PM IST will be processed the following
              business day.
            </li>
            <li>
              During peak seasons or sale events, processing times may be
              extended slightly due to high order volume.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            3. Estimated Delivery Time
          </h2>
          <p>
            Estimated delivery depends on your location and the shipping method
            chosen. The average delivery timelines are:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Metro Cities (e.g., Delhi, Mumbai, Bengaluru):</strong>{" "}
              2–5 business days
            </li>
            <li>
              <strong>Other Urban Areas:</strong> 4–7 business days
            </li>
            <li>
              <strong>Rural / Remote Locations:</strong> 7–10 business days
            </li>
            <li>
              <strong>International Orders:</strong> 10–20 business days
              (depending on destination and customs)
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            4. Shipping Charges
          </h2>
          <p>
            Shipping charges are calculated at checkout and depend on your
            location, total order weight, and delivery method.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Free Shipping:</strong> Available on prepaid orders above
              ₹999 within India.
            </li>
            <li>
              <strong>Standard Shipping:</strong> ₹49–₹99 for orders below ₹999.
            </li>
            <li>
              <strong>Cash on Delivery (COD):</strong> An additional COD
              handling fee of ₹40 may apply.
            </li>
            <li>
              <strong>International Shipping:</strong> Charges vary by country
              and will be displayed at checkout.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            5. Order Tracking
          </h2>
          <p>
            Once your order has been dispatched, you will receive an email
            and/or SMS with your tracking number and a direct link to track your
            shipment. You can also track your order anytime from your account
            dashboard under
            <strong> “My Orders.”</strong>
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            6. Delivery Attempts
          </h2>
          <p>
            Our courier partners will attempt delivery up to{" "}
            <strong>three times</strong>. If the package remains undelivered due
            to incorrect address, unavailability, or refusal to accept, it will
            be returned to us. In such cases, we may deduct return shipping
            charges from your refund (if applicable).
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            7. Cash on Delivery (COD) Orders
          </h2>
          <p>
            For COD orders, please ensure that you are available to receive the
            package and have the exact cash amount ready. Repeated refusals or
            non-acceptance of COD parcels may result in suspension of COD
            facility for your account.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            8. Prepaid Orders
          </h2>
          <p>
            All prepaid orders are processed on priority. Payments made via UPI,
            credit/debit cards, wallets, or net banking are securely processed,
            and confirmation is immediate.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            9. Delayed or Lost Packages
          </h2>
          <p>
            While we make every effort to ensure timely delivery, external
            factors such as weather conditions, courier delays, or customs
            inspections may occasionally cause delays. If your package is
            delayed or lost in transit:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Contact us at{" "}
              <a
                href="mailto:novusmodeonline@gmail.com"
                className="text-[var(--color-inverted-text)] underline"
              >
                novusmodeonline@gmail.com
              </a>{" "}
              with your order number.
            </li>
            <li>
              We will investigate with the courier partner and provide updates
              within 48 hours.
            </li>
            <li>
              If confirmed lost, a replacement or full refund will be issued as
              per your preference.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            10. International Shipping
          </h2>
          <p>
            International orders are subject to customs duties, taxes, or import
            fees imposed by the destination country. These charges are the
            customer’s responsibility and vary by country. Please check with
            your local customs office before placing an international order.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            11. Incorrect or Incomplete Address
          </h2>
          <p>
            Please ensure your shipping address and contact details are accurate
            when placing the order. Orders returned due to incorrect addresses
            or unreachable contact numbers may incur additional reshipping
            charges.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            12. Packaging &amp; Handling
          </h2>
          <p>
            All items are carefully packed in tamper-proof, eco-friendly
            packaging to prevent damage during transit. Garments are folded
            neatly with protective covers where needed.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            13. Order Status Updates
          </h2>
          <p>
            You will receive notifications via email and/or SMS at each stage:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Order Confirmed</li>
            <li>Order Dispatched</li>
            <li>Out for Delivery</li>
            <li>Delivered</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            14. Failed Delivery
          </h2>
          <p>
            In case of failed delivery attempts, our team will reach out via
            phone or email. If we are unable to contact you within 3 business
            days, the order may be automatically canceled and refunded (minus
            any applicable fees).
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            15. Contact Us
          </h2>
          <p>For all shipping or delivery-related concerns, please contact:</p>
          <ul className="space-y-1">
            <li>
              Email:{" "}
              <a
                href="mailto:novusmodeonline@gmail.com"
                className="text-[var(--color-inverted-text)]"
              >
                novusmodeonline@gmail.com
              </a>
            </li>
            <li>Phone: +91 96259 81309</li>
            <li>
              Address: Office No. B-03, Basement, B-103, Sector 2, Noida,
              Gautambuddha Nagar, Uttar Pradesh - 201301
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            16. Policy Updates
          </h2>
          <p>
            We may revise this Shipping &amp; Delivery Policy periodically.
            Updates will be reflected on this page with a new “Last Updated”
            date. Continued use of our website after policy updates constitutes
            acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
