-- CreateTable
CREATE TABLE "ExternalOrderSyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT,
    "orderId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "existsInSabPaisa" BOOLEAN,
    "localOrderFound" BOOLEAN,
    "localOrderCreated" BOOLEAN,
    "localRefreshSuccess" BOOLEAN,
    "forwardedToVendor" BOOLEAN,
    "vendorStatusCode" INTEGER,
    "message" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ExternalOrderSyncLog_orderId_createdAt_idx" ON "ExternalOrderSyncLog"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalOrderSyncLog_batchId_createdAt_idx" ON "ExternalOrderSyncLog"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalOrderSyncLog_source_createdAt_idx" ON "ExternalOrderSyncLog"("source", "createdAt");
