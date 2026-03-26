"use client";

import Link from "next/link";
import { CustomButton, SectionTitle } from "@/components";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const dateInputRef = useRef(null);
  const [error, setError] = useState("");
  const [disableSubmit, setDisableSubmit] = useState(true);
  const [registerFormData, setRegisterFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    phone: "",
    dob: "",
    gender: "",
    termsAccepted: false,
    strongPassword: false,
    isValidEmail: false,
    confirmPasswordMatches: false,
    isValidDOB: true,
  });

  const [testPassword, setTestPassword] = useState({
    length: false,
    specialChar: false,
    number: false,
    uppercase: false,
    lowercase: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [sessionStatus, router, callbackUrl]);

  useEffect(() => {
    const allFieldsFilled = Boolean(
      registerFormData.name &&
      registerFormData.email &&
      registerFormData.password &&
      registerFormData.confirmpassword &&
      registerFormData.termsAccepted &&
      registerFormData.strongPassword &&
      registerFormData.phone &&
      registerFormData.isValidEmail &&
      registerFormData.confirmPasswordMatches &&
      registerFormData.isValidDOB,
    );
    setDisableSubmit(!allFieldsFilled);
  }, [registerFormData]);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateFormData = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    if (name === "email") {
      setRegisterFormData((prev) => ({
        ...prev,
        isValidEmail: isValidEmail(value),
      }));
    }
    if (name === "confirmpassword") {
      setRegisterFormData((prev) => ({
        ...prev,
        confirmPasswordMatches: value === prev.password,
      }));
    }
    if (name === "dob") {
      let formatted = value.replace(/\D/g, "");
      if (formatted.length > 8) formatted = formatted.slice(0, 8);
      if (formatted.length > 4) {
        formatted = `${formatted.slice(0, 2)}/${formatted.slice(
          2,
          4,
        )}/${formatted.slice(4)}`;
      } else if (formatted.length > 2) {
        formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
      }
      setRegisterFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === "phone") {
      const numericOnly = value.replace(/\D/g, ""); // remove all non-digits
      setRegisterFormData((prev) => ({ ...prev, [name]: numericOnly }));
      return;
    }

    setRegisterFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const passwordStrength = (password) => {
    setRegisterFormData((prev) => ({ ...prev, password }));
    const strength = {
      length: password.length >= 8,
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      number: /\d/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    };
    setTestPassword(strength);
    setRegisterFormData((prev) => ({
      ...prev,
      strongPassword: Object.values(strength).every(Boolean),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPasswordMatches } = registerFormData;

    if (!isValidEmail(email)) {
      toast.error("Email is invalid");
      return;
    }
    if (password.length < 8) {
      toast.error("Password is too short");
      return;
    }
    if (!confirmPasswordMatches) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerFormData),
      });

      if (res.status === 400) {
        const errorData = await res.json();
        toast.error(errorData.message);
      } else if (res.status === 200) {
        toast.success("Registration successful");
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        result.ok
          ? router.push(callbackUrl)
          : router.push(
              `/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
            );
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (sessionStatus === "loading") return <h1>Loading...</h1>;

  const floatingInput = (name, label, type = "text", required = false) => {
    const [showDateInput, setShowDateInput] = useState(false);

    const handleDateChange = (e) => {
      const iso = e.target.value; // yyyy-mm-dd
      if (iso) {
        const [y, m, d] = iso.split("-");
        const formatted = `${d}/${m}/${y}`;
        setRegisterFormData((prev) => ({ ...prev, dob: formatted }));
      }
    };

    return (
      <div className="relative">
        {name === "dob" && (
          <>
            {/* Hidden actual date input (calendar) */}
            <input
              type="date"
              ref={dateInputRef}
              onChange={handleDateChange}
              max={new Date().toISOString().split("T")[0]}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 z-10 cursor-pointer"
              style={{ cursor: "pointer" }}
            />
            {/* Calendar icon */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              📅
            </div>
          </>
        )}

        {/* Main visible input */}
        <input
          id={name}
          name={name}
          type={name != "dob" ? type : "text"}
          required={required}
          value={registerFormData[name] || ""}
          maxLength={name == "phone" ? 10 : ""}
          onChange={
            name === "password"
              ? (e) => passwordStrength(e.target.value)
              : updateFormData
          }
          onBlur={(e) => {
            if (name === "dob") {
              const value = e.target.value.trim();
              const clean = value.replace(/[^\d]/g, "");

              if (clean.length === 8) {
                const dd = parseInt(clean.slice(0, 2), 10);
                const mm = parseInt(clean.slice(2, 4), 10) - 1;
                const yyyy = parseInt(clean.slice(4), 10);

                const constructed = new Date(yyyy, mm, dd);
                const isValid =
                  constructed &&
                  constructed.getDate() === dd &&
                  constructed.getMonth() === mm &&
                  constructed.getFullYear() === yyyy &&
                  constructed <= new Date();

                if (isValid) {
                  const formatted = `${String(dd).padStart(2, "0")}/${String(
                    mm + 1,
                  ).padStart(2, "0")}/${yyyy}`;
                  const isoDate = `${yyyy}-${String(mm + 1).padStart(
                    2,
                    "0",
                  )}-${String(dd).padStart(2, "0")}`;
                  if (dateInputRef.current) {
                    dateInputRef.current.value = isoDate;
                  }
                  setRegisterFormData((prev) => ({
                    ...prev,
                    dob: formatted,
                    isValidDOB: true,
                  }));
                } else {
                  // Reset to today's date in hidden date input
                  if (dateInputRef.current) {
                    const today = new Date().toISOString().split("T")[0];
                    dateInputRef.current.value = today;
                  }
                  setRegisterFormData((prev) => ({
                    ...prev,
                    isValidDOB: false,
                  }));
                }
              } else {
                setRegisterFormData((prev) => ({
                  ...prev,
                  isValidDOB: false,
                }));
              }
            }
          }}
          placeholder={label}
          inputMode={name === "phone" ? "numeric" : undefined}
          className={`peer w-full border border-[color:var(--color-inverted-text)] px-3 pr-10 pt-6 pb-2 rounded placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--color-bg)] ${
            registerFormData[name] ? "not-empty" : ""
          }`}
        />

        {/* Label */}
        <label
          htmlFor={name}
          className="absolute left-3 transition-all text-[color:var(--color-inverted-text)] 
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
          peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
          peer-focus:top-2 peer-focus:text-sm peer-focus:translate-y-0 
          not-empty:top-2 not-empty:text-sm not-empty:translate-y-0"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    );
  };

  const PasswordCriteria = () => (
    <div className="text-xs text-gray-600 space-y-1">
      <p className="font-semibold">Password must contain:</p>
      <p className={testPassword.length ? "text-green-600" : "text-red-500"}>
        ✔️ Minimum 8 characters
      </p>
      <p
        className={testPassword.specialChar ? "text-green-600" : "text-red-500"}
      >
        ✔️ Special character
      </p>
      <p className={testPassword.number ? "text-green-600" : "text-red-500"}>
        ✔️ Number
      </p>
      <p className={testPassword.uppercase ? "text-green-600" : "text-red-500"}>
        ✔️ Uppercase letter
      </p>
      <p className={testPassword.lowercase ? "text-green-600" : "text-red-500"}>
        ✔️ Lowercase letter
      </p>
    </div>
  );

  return (
    <div className="bg-[var(--color-inverted-bg)]">
      <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[var(--color-inverted-text)]">
            Create your account
          </h2>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {floatingInput("name", "Full Name", "text", true)}
            {floatingInput("email", "Email Address", "email", true)}
            {!registerFormData.isValidEmail &&
              registerFormData?.email?.length != 0 && (
                <p className="text-red-500">Email ID is not valid.</p>
              )}
            {floatingInput("password", "Password", "password", true)}
            {registerFormData.password &&
              registerFormData.password.length != 0 && <PasswordCriteria />}
            {floatingInput(
              "confirmpassword",
              "Confirm Password",
              "password",
              true,
            )}
            <div className="text-xs text-gray-500 mt-1">
              {registerFormData.confirmpassword.length !== 0 &&
                !registerFormData.confirmPasswordMatches && (
                  <p className="text-red-500">Passwords do not match ❌</p>
                )}
            </div>
            {floatingInput("phone", "Phone Number", "text", true)}
            {floatingInput("dob", "Date of Birth (DD/MM/YYYY)", "date")}
            {!registerFormData.isValidDOB &&
              registerFormData.dob.length != 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid date in DD/MM/YYYY format
                </p>
              )}

            <div className="relative">
              <select
                name="gender"
                onChange={updateFormData}
                className="appearance-none w-full px-3 py-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bg)]"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                required
                checked={registerFormData.termsAccepted}
                onChange={updateFormData}
                className="h-4 w-4 text-[var(--color-bg)] border-gray-300 rounded"
              />
              <label
                htmlFor="termsAccepted"
                className="ml-2 block text-sm text-gray-900"
              >
                I accept the{" "}
                <Link
                  href="/terms-and-conditions"
                  className="text-blue-600 hover:underline"
                >
                  Terms and Conditions
                </Link>{" "}
                &{" "}
                <Link
                  href="/privacy-policy"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>

            <CustomButton
              buttonType="submit"
              text="Sign up"
              paddingX={3}
              paddingY={1.5}
              customWidth="full"
              textSize="sm"
              disabled={disableSubmit}
            />

            {error && (
              <p className="text-red-600 text-center text-sm">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
