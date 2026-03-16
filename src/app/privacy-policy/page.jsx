// app/privacy-policy/page.jsx

export const metadata = {
  title: "Privacy Policy | NovusMode",
  description:
    "Learn how NovusMode collects, uses, and protects your personal information when you shop with us.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8 md:p-12 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">
          Last Updated: <strong>28/10/2025</strong>
        </p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            At <strong>NovusMode</strong>(operated by OIN GLOBAL SERVICES PVT
            LTD) ("we," "our," or "us"), your privacy is important to us. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your personal information when you visit our website{" "}
            <strong>novusmode.com</strong> ("Site") and use our
            services.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            1. Information We Collect
          </h2>
          <p>
            We collect both personal and non-personal information to provide a
            better shopping experience. The types of data we collect include:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Personal Information:</strong> Name, email address, phone
              number, shipping/billing address, and payment details.
            </li>
            <li>
              <strong>Account Information:</strong> Login credentials, account
              preferences, and saved addresses.
            </li>
            <li>
              <strong>Transaction Data:</strong> Purchase history and order
              details.
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type,
              operating system, device identifiers, and analytics data.
            </li>
            <li>
              <strong>Cookies & Tracking:</strong> We use cookies and similar
              technologies to personalize content and improve your shopping
              experience.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To process and deliver your orders.</li>
            <li>To provide customer support and respond to inquiries.</li>
            <li>To send order updates, promotions, and marketing materials.</li>
            <li>To improve our website, products, and services.</li>
            <li>To comply with legal obligations and prevent fraud.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            3. Payment Information
          </h2>
          <p>
            We use secure third-party payment gateways to process online
            transactions. Your payment details (like card or UPI information)
            are encrypted and handled directly by the payment provider. We do
            not store or have access to your complete payment data.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            4. Sharing of Information
          </h2>
          <p>
            We do not sell or rent your personal data. However, we may share
            your information with:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Service Providers:</strong> Delivery partners, payment
              processors, analytics tools, and marketing platforms.
            </li>
            <li>
              <strong>Legal Authorities:</strong> When required by law or to
              protect our legal rights.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            5. Cookies and Tracking Technologies
          </h2>
          <p>
            We use cookies to enhance your browsing experience, remember your
            preferences, and analyze traffic. You can disable cookies in your
            browser settings, but some features of our website may not function
            properly as a result.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            6. Data Security
          </h2>
          <p>
            We use industry-standard security measures — including SSL
            encryption and secure servers — to protect your personal
            information. However, please note that no method of transmission
            over the internet is 100% secure.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            7. Data Retention
          </h2>
          <p>
            We retain your information only as long as necessary to fulfill the
            purposes outlined in this policy or as required by law. You may
            request deletion of your data by contacting us.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            8. Your Rights
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Access, correct, or update your personal data.</li>
            <li>Request deletion of your account or stored data.</li>
            <li>Opt-out of marketing communications at any time.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800">
            9. Third-Party Links
          </h2>
          <p>
            Our website may include links to external sites. We are not
            responsible for their privacy practices, content, or security
            policies.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            10. Children’s Privacy
          </h2>
          <p>
            Our website is not intended for children under 13 years of age. We
            do not knowingly collect data from minors.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            11. Updates to This Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. Any changes will be
            posted on this page with the updated date. Continued use of our
            website implies acceptance of the revised policy.
          </p>

          <h2 className="text-xl font-semibold text-gray-800">
            12. Contact Us
          </h2>
          <p>
            For questions or concerns regarding this Privacy Policy, please
            contact us at:
          </p>
          <ul className="space-y-1">
            <li>
              Email:{" "}
              <a
                href="mailto:novusmodeonline@gmail.com"
                className="text-green-600"
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
