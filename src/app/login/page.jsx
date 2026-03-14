"use client";
import { isValidEmailAddressFormat } from "@/scripts/utils";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "authenticated" && !callbackUrl) {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (!isValidEmailAddressFormat(email)) {
      setError("Email is invalid");
      toast.error("Email is invalid");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password is invalid");
      toast.error("Password must be at least 8 characters");
      return;
    }
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setError("");
    toast.success("Login successful");
    router.replace(result.url || "/");
  };

  if (sessionStatus === "loading") {
    return <h1 className="text-center mt-20">Loading...</h1>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] px-6 md:px-24 py-12">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-8 text-[var(--color-inverted-text)]">
        <h2 className="text-center text-3xl font-semibold mb-6">
          Sign in to your account
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[var(--color-bg)] focus:ring-[var(--color-bg)] sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[var(--color-bg)] focus:ring-[var(--color-bg)] sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[var(--color-bg)] focus:ring-[var(--color-bg)]"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-[var(--color-bg)] hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2 px-4 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-bg)] transition"
          >
            Sign in
          </button>

          {error && (
            <p className="text-center text-sm mt-2 text-red-600">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
