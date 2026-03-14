"use client";

import React from "react";
import { UPIQRCodeFlow, UPIIntentFlow } from "@/components";

export default function UpiPaymentForm({
  upiId,
  onUpiIdChange,
  onIntentClick,
  validatePayer,
  qrUrl,
  generateQr,
  loading,
  data,
  polling = { polling },
  timer = { timer },
  qrSuccess = { qrSuccess },
  qrError = { qrError },
}) {
  return (
    <div className="space-y-6">
      <UPIIntentFlow
        upiId={upiId}
        onUpiIdChange={onUpiIdChange}
        onIntentClick={onIntentClick}
        validatePayer={validatePayer}
        data={data}
        loading={loading}
      />

      <UPIQRCodeFlow
        qrUrl={qrUrl}
        generateQr={generateQr}
        loading={loading}
        polling={polling}
        success={qrSuccess}
        error={qrError}
        timer={timer}
      />
    </div>
  );
}
