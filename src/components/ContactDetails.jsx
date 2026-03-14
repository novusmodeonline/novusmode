"use client";

import React, { useState, useEffect } from "react";
import { FloatingInput } from "@/components";
import { useSession } from "next-auth/react";
import { validateEmail, validatePhone, validateFullName } from "@/helper/common";

const ContactDetails = ({ onNext }) => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: session?.user?.phone || "",
  });

  useEffect(() => {
  if (session?.user) {
    setFormData({
      fullName: session.user.name || "",
      email: session.user.email || "",
      phone: session.user.phone || "",
    });
  }
}, [session]);

  const [errors, setErrors] = useState({});

  // ---------------------------
  // FIELD VALIDATION (from common.js)
  // ---------------------------
  const handleValidate = (name, value) => {
    let valid = true;

    switch (name) {
      case "fullName":
        valid = validateFullName(value);
        break;

      case "email":
        valid = validateEmail(value);
        break;

      case "phone":
        valid = validatePhone(value);
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: valid ? null : `Invalid ${name}`,
    }));
  };

  // ---------------------------
  // UPDATE FORM DATA
  // ---------------------------
  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------
  // PROCEED BUTTON VALIDATION
  // ---------------------------
  const handleProceed = () => {
    const newErrors = {};

    if (!validateFullName(formData.fullName))
      newErrors.fullName = "Full Name is required";

    if (!validateEmail(formData.email))
      newErrors.email = "Enter a valid email";

    if (!validatePhone(formData.phone))
      newErrors.phone = "Enter valid 10-digit phone number";

    setErrors(newErrors);

    if (Object.keys(newErrors).length) return;

    onNext && onNext(formData);
  };

  return (
    <div className="space-y-6">
      <FloatingInput
        name="fullName"
        label="Full Name"
        required
        value={formData.fullName}
        error={errors.fullName}
        onChange={handleFieldChange}
        validator={handleValidate}
      />

      <FloatingInput
        name="email"
        label="Email Address"
        required
        value={formData.email}
        error={errors.email}
        onChange={handleFieldChange}
        validator={handleValidate}
      />

      <FloatingInput
        name="phone"
        label="Phone Number"
        required
        value={formData.phone}
        error={errors.phone}
        onChange={handleFieldChange}
        validator={handleValidate}
      />

      <button
        onClick={handleProceed}
        className="w-full bg-[color:var(--color-bg)] text-white py-3 rounded-lg"
      >
        Proceed
      </button>
    </div>
  );
};

export default ContactDetails;
