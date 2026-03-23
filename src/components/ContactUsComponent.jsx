"use client";

import { useEffect } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactUsComponent() {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  const contactInfo = {
    company: "OIN GLOBAL SERVICES PVT LTD",
    email: "info.ionglobalservices@gmail.com",
    phone: "+91 96259 81309",
    address:
      "Office No. B-03, Basement, B-103, Sector 2, Noida, Gautambuddha Nagar, Uttar Pradesh - 201301",
    mapUrl: "https://maps.app.goo.gl/8yovSHARyNuvHLAA8",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7006.9551120057895!2d77.30496757770995!3d28.585446999999988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5003a836a65%3A0xc1118d00da4becaf!2sSector%20-%202%20Noida!5e0!3m2!1sen!2ssg!4v1774260763434!5m2!1sen!2ssg",
  };

  return (
    <div className="bg-[var(--color-inverted-bg)] min-h-screen py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-16 md:mb-20 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-inverted-text)] mb-4">
            Get in <span className="text-[var(--secondary-color)]">Touch</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            We'd love to hear from you. Whether you have questions about our
            products, need assistance, or just want to say hello — reach out to
            us today.
          </p>
        </section>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Company Info */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-[var(--color-bg)] to-[#1a1245] rounded-2xl p-8 md:p-10 text-white shadow-lg">
              {/* Company Header */}
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[var(--secondary-color)]">
                {contactInfo.company}
              </h2>
              <p className="text-white/70 mb-8 border-b border-white/20 pb-8">
                Your trusted fashion destination for quality and style.
              </p>

              {/* Contact Details Section */}
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <Mail className="w-6 h-6 text-[var(--secondary-color)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-[var(--secondary-color)] hover:text-[var(--secondary-color)]/80 transition-colors duration-300 text-lg break-all underline hover:no-underline"
                    >
                      {contactInfo.email}
                    </a>
                    <p className="text-white/60 text-sm mt-1">
                      Get a response within 24 hours
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <Phone className="w-6 h-6 text-[var(--secondary-color)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Phone</h3>
                    <a
                      href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                      className="text-[var(--secondary-color)] hover:text-[var(--secondary-color)]/80 transition-colors duration-300 text-lg underline hover:no-underline"
                    >
                      {contactInfo.phone}
                    </a>
                    <p className="text-white/60 text-sm mt-1">
                      Monday to Friday, 9 AM - 6 PM IST
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="w-6 h-6 text-[var(--secondary-color)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Address</h3>
                    <a
                      href={contactInfo.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-[var(--secondary-color)] transition-colors duration-300 leading-relaxed underline hover:no-underline"
                    >
                      {contactInfo.address}
                    </a>
                    <p className="text-white/60 text-sm mt-2">
                      Click to view on Google Maps
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-10 pt-8 border-t border-white/20">
                <h3 className="font-semibold text-white mb-4">
                  Business Hours
                </h3>
                <div className="space-y-2 text-white/70 text-sm">
                  <p>
                    <span className="font-medium text-white">
                      Monday - Friday:
                    </span>{" "}
                    9:00 AM - 6:00 PM IST
                  </p>
                  <p>
                    <span className="font-medium text-white">Saturday:</span>{" "}
                    10:00 AM - 4:00 PM IST
                  </p>
                  <p>
                    <span className="font-medium text-white">Sunday:</span>{" "}
                    Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
              <div className="relative w-full h-[500px] lg:h-[600px]">
                <iframe
                  title="NovusMode Location"
                  className="w-full h-full border-none"
                  style={{
                    filter: "contrast(1.1) brightness(0.9) invert(0.02)",
                  }}
                  src={contactInfo.mapEmbedUrl}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Map Info Card */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
                <h3 className="text-lg font-semibold text-[var(--color-inverted-text)] mb-3">
                  Our Office Location
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Visit our office headquarters in Noida. Our team is here to
                  assist with any inquiries or collaborations. Use the map to
                  find exact directions.
                </p>
                <a
                  href={contactInfo.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-[var(--secondary-color)] text-white font-semibold rounded-lg hover:bg-[var(--secondary-color)]/90 transition-all duration-300 transform hover:scale-105"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section (Optional) */}
        <section className="mt-20 md:mt-24">
          <h2 className="text-3xl font-bold text-[var(--color-inverted-text)] mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: "What's the best way to reach you?",
                a: "Email us at info.ionglobalservices@gmail.com or call +91 96259 81309. We respond to emails within 24 hours.",
              },
              {
                q: "Where is your office located?",
                a: "Our office is based in Noida, UP. You can visit us during business hours or email/call for virtual consultations.",
              },
              {
                q: "What are your customer support hours?",
                a: "Monday to Friday: 9 AM - 6 PM IST. Saturday: 10 AM - 4 PM IST. We're closed on Sundays.",
              },
              {
                q: "How long does it take to get a response?",
                a: "We aim to respond to all inquiries within 24 business hours. Urgent matters are prioritized.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[var(--secondary-color)] transition-colors duration-300"
              >
                <h3 className="font-semibold text-[var(--color-inverted-text)] text-lg mb-3">
                  {item.q}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
