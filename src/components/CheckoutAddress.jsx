"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FiLoader } from "react-icons/fi";
import FloatingInput from "./FloatingInput";
import { SearchableSelect } from "@/components";
import { INDIAN_STATES } from "@/config/staticValue";

export default function CheckoutAddress({
  savedAddresses = [],
  onSaveAndNext,
  editAddress = null, // ✅ NEW
}) {
  const [formValues, setFormValues] = useState({
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveDefault, setSaveDefault] = useState(false);

  // ✅ AUTO-FILL WHEN EDITING
  useEffect(() => {
    if (editAddress) {
      setFormValues({
        address1: editAddress.address1 || "",
        address2: editAddress.address2 || "",
        city: editAddress.city || "",
        state: editAddress.state || "",
        pincode: editAddress.pincode || "",
        country: editAddress.country || "India",
      });

      setSaveDefault(!!editAddress.isDefault);
    }
  }, [editAddress]);

  const isDuplicate = useMemo(() => {
    return savedAddresses.some((addr) => {
      return (
        addr.address1 === formValues.address1 &&
        addr.address2 === formValues.address2 &&
        addr.city === formValues.city &&
        addr.state === formValues.state &&
        addr.pincode === formValues.pincode
      );
    });
  }, [formValues, savedAddresses]);

  const validate = () => {
    const errs = {};

    if (!formValues.address1 || formValues.address1.trim().length < 3)
      errs.address1 = "Address line is required";

    if (!formValues.city) errs.city = "City required";
    if (!formValues.state) errs.state = "State required";

    if (!/^\d{6}$/.test(formValues.pincode || ""))
      errs.pincode = "6 digit pincode required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (isDuplicate && !editAddress) {
      alert("This address already exists.");
      return;
    }

    setLoading(true);

    const payload = {
      ...formValues,
      isDefault: saveDefault,
    };

    setTimeout(() => {
      setLoading(false);
      onSaveAndNext(payload);
    }, 600);
  };

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form space-y-6 relative">
      {loading && (
        <div className="loader-overlay">
          <FiLoader className="loader-spin" />
        </div>
      )}

      <FloatingInput
        name="address1"
        label="Address Line 1"
        value={formValues.address1}
        onChange={handleChange}
        error={errors.address1}
      />

      <FloatingInput
        name="address2"
        label="Address Line 2 (optional)"
        value={formValues.address2}
        onChange={handleChange}
      />

      <FloatingInput
        name="city"
        label="City"
        value={formValues.city}
        onChange={handleChange}
        error={errors.city}
      />

      <SearchableSelect
        label="State"
        value={formValues.state}
        options={INDIAN_STATES}
        onChange={(val) => handleChange("state", val)}
        error={errors.state}
      />

      <FloatingInput
        name="pincode"
        label="Pincode"
        value={formValues.pincode}
        onChange={handleChange}
        error={errors.pincode}
      />

      <FloatingInput
        name="country"
        label="Country"
        value={formValues.country}
        onChange={handleChange}
      />

      <div className="flex items-center gap-3 mt-3">
        <input
          id="saveDefault"
          type="checkbox"
          checked={saveDefault}
          onChange={(e) => setSaveDefault(e.target.checked)}
        />
        <label htmlFor="saveDefault" className="text-sm">
          Save as default address
        </label>
      </div>

      <button type="submit" className="next-btn">
        {editAddress ? "Update Address" : "Save & Continue"}
      </button>
    </form>
  );
}
