export const metadata = {
  title: "Terms & Conditions | NovusMode",
  description:
    "Read the terms and conditions for shopping with NovusMode. Learn about our payment, delivery, and return policies.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8 md:p-12 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm">
          Last Updated: <strong>28/10/2025</strong>
        </p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Welcome to <strong>NovusMode</strong>(operated by OIN GLOBAL
            SERVICES PVT LTD) ("we," "our," "us"). By accessing or purchasing
            from our website <strong>novusmode.com</strong> ("Site"), you agree
            to comply with and be bound by these Terms and Conditions. Please
            read them carefully before using our services.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            1. General Information
          </h2>
          <p>
            These Terms & Conditions apply to all visitors, users, and customers
            of our website. By accessing the Site, you agree to follow these
            terms and any updates we may post in the future.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            2. Eligibility
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>You must be at least 18 years old or have guardian consent.</li>
            <li>Provide accurate and complete personal information.</li>
            <li>Use the website only for lawful purposes.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            3. Products & Services
          </h2>
          <p>
            We specialize in men’s, women’s, and unisex garments, including
            shirts, t-shirts, jackets, and other apparel. Product images are for
            illustration purposes only. Actual colors or fits may vary slightly
            due to lighting or screen settings.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            4. Pricing & Payments
          </h2>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Cash on Delivery (COD)</strong>
            </li>
            <li>
              <strong>Online payments</strong> — we accept major debit/credit
              cards, UPI, and net banking.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            5. Shipping & Delivery
          </h2>
          <p>
            We deliver across India through trusted courier partners. Delivery
            typically takes 3–7 business days, depending on your location.
            Delays due to logistics or weather are beyond our control.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            6. Returns, Exchanges & Refunds
          </h2>
          <p>
            You may request a return or exchange within 7 days of delivery if
            the product is damaged, defective, or incorrect. Items must be
            unused and in original packaging. COD refunds will be processed via
            bank transfer.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            7. Order Cancellations
          </h2>
          <p>
            Orders can be canceled before shipping. Once dispatched,
            cancellations are not accepted. We reserve the right to cancel any
            order for product unavailability or payment issues.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            8. User Accounts
          </h2>
          <p>
            You are responsible for maintaining your account credentials. We are
            not liable for any loss resulting from unauthorized use.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            9. Intellectual Property
          </h2>
          <p>
            All content, including text, images, and logos, belongs to{" "}
            <strong>NovusMode</strong> and is protected by copyright law.
            Reproduction without written permission is prohibited.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            10. Limitation of Liability
          </h2>
          <p>
            We are not liable for indirect or consequential damages arising from
            use of our website or products. Our total liability shall not exceed
            the value of the purchased item.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            11. Privacy Policy
          </h2>
          <p>
            Your personal data is handled as per our{" "}
            <a
              href="/privacy-policy"
              className="text-[var(--color-inverted-text)] underline"
            >
              Privacy Policy
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            12. Third-Party Links
          </h2>
          <p>
            Our site may include links to third-party websites. We are not
            responsible for their content, practices, or terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            13. Changes to Terms
          </h2>
          <p>
            We may modify these terms at any time. Updates will be effective
            once posted here, with the revised date shown above.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            14. Governing Law & Jurisdiction
          </h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be
            subject to the courts of Uttar Pradesh, India.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            15. Contact Us
          </h2>
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
        </section>
      </div>
    </div>
  );
}
