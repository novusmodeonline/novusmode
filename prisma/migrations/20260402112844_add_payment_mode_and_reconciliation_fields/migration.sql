-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "mode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "amount" INTEGER NOT NULL,
    "gatewayId" TEXT,
    "gatewayOrderId" TEXT,
    "responseCode" TEXT,
    "responseMessage" TEXT,
    "payerAddress" TEXT,
    "payerName" TEXT,
    "pgRefNum" TEXT,
    "rrn" TEXT,
    "qrString" TEXT,
    "rawResponse" JSONB,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "webhookReceivedAt" DATETIME,
    "processedAt" DATETIME,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "reconciliationRequired" BOOLEAN NOT NULL DEFAULT false,
    "reconciliationStatus" TEXT,
    "reconciliationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastReconciliationAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "gatewayId", "gatewayOrderId", "id", "method", "orderId", "payerAddress", "payerName", "pgRefNum", "processedAt", "qrString", "rawResponse", "responseCode", "responseMessage", "retryCount", "rrn", "status", "updatedAt", "webhookReceivedAt", "webhookVerified") SELECT "amount", "createdAt", "gatewayId", "gatewayOrderId", "id", "method", "orderId", "payerAddress", "payerName", "pgRefNum", "processedAt", "qrString", "rawResponse", "responseCode", "responseMessage", "retryCount", "rrn", "status", "updatedAt", "webhookReceivedAt", "webhookVerified" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
