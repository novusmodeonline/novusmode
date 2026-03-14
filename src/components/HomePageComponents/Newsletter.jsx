"use client";
import { useState } from "react";
import { MailCheck } from "lucide-react"; // Or use any mail icon you want
import toast from "react-hot-toast";

export default function NewsletterSignup({ isFooter = false }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (result.success) {
        setSubmitted(true);
        setEmail("");
        toast.success("Subscribed to newsletter!");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      alert("Network error. Please try again later!");
    }
  };

  return (
    <>
      {!isFooter ? (
        <section className="w-full max-w-2xl mx-auto my-16 rounded-3xl px-8 py-10 shadow-2xl bg-gradient-to-r from-[#eafbe4] via-white to-[#f6fef5] flex flex-col items-center border border-[var(--color-bg)]">
          <div className="flex flex-col items-center mb-5">
            <MailCheck className="w-12 h-12 mb-2 text-[var(--color-bg)]" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-bg)] text-center mb-2 tracking-wide">
              Join our Style Club!
            </h2>
            <p className="text-center text-base md:text-lg text-[var(--color-bg)]/90 max-w-lg font-medium">
              Get ₹200 off your first order + unlock exclusive sales and fashion
              updates. We only send the good stuff!
            </p>
          </div>
          {submitted ? (
            <div className="text-green-700 font-semibold text-center mt-4">
              🎉 You’re on the list! Check your email for a special welcome
              offer.
            </div>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center mt-2"
              onSubmit={handleSubscribe}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your best email"
                className="border border-[var(--color-bg)] rounded-xl px-4 py-3 w-full sm:w-[280px] text-[var(--color-bg)] bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-bg)]"
              />
              <button
                type="submit"
                className="bg-[var(--color-bg)] text-white rounded-xl px-7 py-3 font-bold text-base shadow hover:bg-[var(--color-bg)]/90 transition-all min-w-[140px] whitespace-nowrap"
              >
                Get My Offer
              </button>
            </form>
          )}
        </section>
      ) : (
        <div className="flex-1 min-w-[230px]">
          <h3 className="font-semibold text-lg mb-3 text-white">Newsletter</h3>
          <p className="text-white/80 mb-3 text-sm">
            Sign up for exclusive offers and get ₹200 off your first order!
          </p>
          {/* Inline mini newsletter form */}
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              alert(
                "Thanks for subscribing! (Connect this to your newsletter logic.)"
              );
            }}
          >
            <input
              type="email"
              required
              placeholder="Your email"
              className="rounded-lg px-3 py-2 bg-white border border-gray-300 text-gray-900 w-full sm:w-auto focus:border-[var(--color-bg)] focus:ring-2 focus:ring-[var(--color-bg)] outline-none transition"
            />

            <button
              type="submit"
              className="bg-[var(--color-bg)] text-[var(--color-text)] border border-white font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-inverted-bg)] hover:text-[var(--color-inverted-text)] transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      )}
    </>
  );
}
