"use client";

import { useMemo, useState } from "react";

function sanitize(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0.00";
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
}

function submitHiddenForm({ endpoint, encData, clientCode }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = endpoint;

  const add = (name, value) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  add("encData", encData);
  add("clientCode", clientCode);

  document.body.appendChild(form);
  form.submit();
}

function postDebugToServer(debugData) {
  const body = JSON.stringify(debugData);

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/sabpaisa/debug", blob);
    return;
  }

  fetch("/api/sabpaisa/debug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // best-effort debug logging only
  });
}

export default function SabPaisaButton({
  payerName,
  payerEmail,
  payerMobile,
  amount,
  clientTxnId,
  orderId,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const generatedTxnId = useMemo(
    () => clientTxnId ?? `txn_${Date.now()}`,
    [clientTxnId],
  );

  const amountString = normalizeAmount(amount);

  const handlePay = async () => {
    if (!orderId) {
      alert("Order is not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    console.group("[SabPaisa] Payment Request Debug");

    try {
      const res = await fetch("/api/encryptdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          clientTxnId: generatedTxnId,
          payerName: sanitize(payerName),
          payerEmail: sanitize(payerEmail),
          payerMobile: sanitize(payerMobile),
          amount: amountString,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to initialize SabPaisa payment");
      }

      const endpoint = data?.endpoint;
      const encData = data?.postBody?.encData;
      const clientCode = data?.postBody?.clientCode;

      if (!endpoint || !encData || !clientCode) {
        throw new Error("SabPaisa initialization response is incomplete");
      }

      console.log("init response", data);

      postDebugToServer({
        source: "SabPaisaButton",
        orderId,
        clientTxnId: generatedTxnId,
        endpoint,
        encryptedEncData: encData,
        postedClientCode: clientCode,
        formAction: endpoint,
        timestamp: new Date().toISOString(),
      });

      submitHiddenForm({
        endpoint,
        encData,
        clientCode,
      });
    } catch (error) {
      console.error("SabPaisa submit failed", error);
      alert("Unable to start SabPaisa payment. Please try again.");
    } finally {
      setIsSubmitting(false);
      console.groupEnd();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={isSubmitting}
      className="rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-semibold text-white"
    >
      {isSubmitting ? "Redirecting..." : "Continue to SabPaisa"}
    </button>
  );
}
