"use client";

import React, { useState } from "react";
import toast from "react-hot-toast"; // For the toast notification
import { FaBell } from "react-icons/fa"; // Notify icon

const NotifyMe = ({ product }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(""); // Email input for notifications

  const handleNotifyMe = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      // Simulating the notification request (could be an API call here)
      localStorage.setItem(`notify_${product?.id}`, email); // Store email in local storage (or send to backend)
      toast.success(
        `You will be notified at ${email} when the product is back in stock.`
      );
    } catch (error) {
      toast.error("Error while saving notification request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 max-[500px]:flex-col max-[500px]:gap-4">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-10 w-60 px-4 border border-gray-300 rounded-md"
      />
      <button
        onClick={handleNotifyMe}
        disabled={loading}
        className={`btn text-lg font-semibold text-[var(--color-bg)] bg-transparent border border-[var(--color-bg)] transition-all ease-in transform hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] hover:border-transparent max-[500px]:w-full h-12 px-4 py-2 flex items-center justify-center ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        }`}
      >
        {loading ? (
          "Submitting..."
        ) : (
          <>
            <FaBell className="mr-2 text-xl" /> {/* Adjust icon size */}
            Notify Me
          </>
        )}
      </button>
    </div>
  );
};

export default NotifyMe;
