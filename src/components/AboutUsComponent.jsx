"use client";

import { useEffect } from "react";

export default function AboutUsComponent() {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8 md:p-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            About <span className="text-green-600">NovusMode</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Where quality meets comfort. We’re dedicated to crafting clothing
            that blends effortless style, perfect fit, and timeless confidence —
            designed for every day, for everyone.
          </p>
        </section>

        {/* Our Story */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Our Story</h2>
          <p className="text-gray-700 leading-relaxed">
            Founded in 2025, <strong>NovusMode</strong>(operated by Zorvigo
            Technology Pvt. Ltd.) was born out of a simple idea — that fashion
            should feel as good as it looks. We started as a small local label
            with a passion for creating high-quality garments that are
            versatile, modern, and made to last.
          </p>
          <p className="text-gray-700 leading-relaxed">
            What began with a few classic pieces has grown into a full
            collection of everyday essentials — from casual jackets to timeless
            shirts — all crafted with premium fabrics and attention to detail.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Today, we continue our journey to redefine wardrobe staples by
            combining contemporary design with sustainable thinking and honest
            craftsmanship.
          </p>
        </section>

        {/* Mission & Values */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Our Mission &amp; Values
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Our mission is simple — to make high-quality, comfortable fashion
            accessible to everyone while keeping sustainability and customer
            satisfaction at our core.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc list-inside text-gray-700">
            <li>Premium quality materials</li>
            <li>Timeless, modern design</li>
            <li>Responsible manufacturing</li>
            <li>Affordable everyday wear</li>
            <li>Customer-first approach</li>
            <li>Transparency and trust</li>
          </ul>
        </section>

        {/* Customer Commitment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Our Promise to You
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We stand behind every product we make. From fabric selection to
            final stitching, each piece goes through a rigorous quality check to
            ensure it meets our standards of comfort and durability.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Enjoy seamless shopping with secure payments via{" "}
            <strong>Pay10 Payment Gateway</strong>, easy returns, and responsive
            support that’s always ready to help.
          </p>
        </section>

        {/* Contact Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Contact Details */}
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Address:</strong> Plot no. A1 D Mall, Netaji Subhash
                Place, North West Delhi, 110034
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:connect@NovusModeapparels.com"
                  className="text-green-600 underline"
                >
                  connect@NovusModeapparels.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong> +91 99118 01871
              </p>
              <p>
                <strong>Business Hours:</strong> Mon–Fri, 10 AM – 6 PM
              </p>
            </div>

            {/* Right: Embedded Google Map */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <iframe
                title="Store Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3499.908811082738!2d77.15072507409698!3d28.692374281363236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d031c9a539885%3A0x6eeaa336893a5c65!2sD%20Mall!5e0!3m2!1sen!2sin!4v1763021899583!5m2!1sen!2sin"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
