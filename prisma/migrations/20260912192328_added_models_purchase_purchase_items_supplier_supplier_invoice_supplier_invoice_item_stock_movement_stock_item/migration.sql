-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierInvoiceKind" AS ENUM ('INVOICE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "SupplierInvoiceStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierInvoiceSettlementStatus" AS ENUM ('UNSETTLED', 'PARTIALLY_SETTLED', 'SETTLED');

-- CreateEnum
CREATE TYPE "StockMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM ('OPENING_BALANCE', 'PURCHASE', 'CONSUMPTION', 'SUPPLIER_RETURN', 'RETURN_TO_STOCK', 'ADJUSTMENT', 'REVERSAL');

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "trackStock" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "unitPrice" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "label" TEXT,
    "purchaseDate" DATE NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'CONFIRMED',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "taxExclusiveAmount" DECIMAL(19,2),
    "vatAmount" DECIMAL(19,2),
    "taxInclusiveAmount" DECIMAL(19,2) NOT NULL,
    "deductibleVatAmount" DECIMAL(19,2),
    "effectiveCostAmount" DECIMAL(19,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paymentAccountId" TEXT,
    "bankTransactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "catalogItemId" TEXT,
    "type" "LineItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
    "unitCode" TEXT NOT NULL,
    "unitLabel" TEXT,
    "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
    "baseQuantityUnitCode" TEXT,
    "unitPrice" DECIMAL(19,6),
    "taxExclusiveAmount" DECIMAL(19,2),
    "vatRate" DECIMAL(5,2),
    "vatAmount" DECIMAL(19,2),
    "deductibleVatAmount" DECIMAL(19,2),
    "taxInclusiveAmount" DECIMAL(19,2) NOT NULL,
    "effectiveCostAmount" DECIMAL(19,2) NOT NULL,
    "effectiveUnitCost" DECIMAL(19,6) NOT NULL,
    "projectId" TEXT,
    "workOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reference" TEXT,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "sirenNumber" TEXT,
    "siretNumber" TEXT,
    "vatNumber" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "street1" TEXT,
    "street2" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'FR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "kind" "SupplierInvoiceKind" NOT NULL DEFAULT 'INVOICE',
    "status" "SupplierInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierInvoiceNumber" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "receivedDate" DATE,
    "dueDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "supplierName" TEXT NOT NULL,
    "supplierLegalName" TEXT,
    "supplierSirenNumber" TEXT,
    "supplierSiretNumber" TEXT,
    "supplierVatNumber" TEXT,
    "supplierEmail" TEXT,
    "supplierStreet1" TEXT,
    "supplierStreet2" TEXT,
    "supplierPostalCode" TEXT,
    "supplierCity" TEXT,
    "supplierCountryCode" TEXT NOT NULL DEFAULT 'FR',
    "lineNetTotal" DECIMAL(19,2),
    "allowanceTotal" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "chargeTotal" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "taxExclusiveAmount" DECIMAL(19,2) NOT NULL,
    "vatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "taxInclusiveAmount" DECIMAL(19,2) NOT NULL,
    "deductibleVatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "settledAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "openAmount" DECIMAL(19,2) NOT NULL,
    "settlementStatus" "SupplierInvoiceSettlementStatus" NOT NULL DEFAULT 'UNSETTLED',
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoiceItem" (
    "id" TEXT NOT NULL,
    "supplierInvoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "lineIdentifier" TEXT,
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" "LineItemType",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sellerItemIdentifier" TEXT,
    "quantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
    "unitCode" TEXT,
    "unitLabel" TEXT,
    "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
    "baseQuantityUnitCode" TEXT,
    "unitPrice" DECIMAL(19,6),
    "taxExclusiveAmount" DECIMAL(19,2) NOT NULL,
    "vatCategory" "VatCategory" NOT NULL DEFAULT 'STANDARD',
    "vatRate" DECIMAL(5,2),
    "vatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "deductibleVatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "vatExemptionReason" TEXT,
    "vatExemptionReasonCode" TEXT,
    "taxInclusiveAmount" DECIMAL(19,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "direction" "StockMovementDirection" NOT NULL,
    "reason" "StockMovementReason" NOT NULL,
    "quantity" DECIMAL(19,6) NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unitCost" DECIMAL(19,6),
    "totalCost" DECIMAL(19,2),
    "purchaseItemId" TEXT,
    "workLogItemId" TEXT,
    "reversedMovementId" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "quantityOnHand" DECIMAL(19,6) NOT NULL DEFAULT 0,
    "averageUnitCost" DECIMAL(19,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_tenantId_purchaseDate_idx" ON "Purchase"("tenantId", "purchaseDate");

-- CreateIndex
CREATE INDEX "Purchase_tenantId_status_idx" ON "Purchase"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Purchase_paymentAccountId_idx" ON "Purchase"("paymentAccountId");

-- CreateIndex
CREATE INDEX "Purchase_bankTransactionId_idx" ON "Purchase"("bankTransactionId");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_catalogItemId_idx" ON "PurchaseItem"("catalogItemId");

-- CreateIndex
CREATE INDEX "PurchaseItem_projectId_idx" ON "PurchaseItem"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseItem_workOrderId_idx" ON "PurchaseItem"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseItem_purchaseId_position_key" ON "PurchaseItem"("purchaseId", "position");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_name_idx" ON "Supplier"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_archivedAt_idx" ON "Supplier"("tenantId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_tenantId_reference_key" ON "Supplier"("tenantId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_tenantId_siretNumber_key" ON "Supplier"("tenantId", "siretNumber");

-- CreateIndex
CREATE INDEX "SupplierInvoice_tenantId_issueDate_idx" ON "SupplierInvoice"("tenantId", "issueDate");

-- CreateIndex
CREATE INDEX "SupplierInvoice_tenantId_dueDate_idx" ON "SupplierInvoice"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "SupplierInvoice_tenantId_status_idx" ON "SupplierInvoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SupplierInvoice_tenantId_settlementStatus_idx" ON "SupplierInvoice"("tenantId", "settlementStatus");

-- CreateIndex
CREATE INDEX "SupplierInvoice_supplierId_issueDate_idx" ON "SupplierInvoice"("supplierId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_tenantId_supplierId_supplierInvoiceNumber_key" ON "SupplierInvoice"("tenantId", "supplierId", "supplierInvoiceNumber");

-- CreateIndex
CREATE INDEX "SupplierInvoiceItem_supplierInvoiceId_idx" ON "SupplierInvoiceItem"("supplierInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoiceItem_supplierInvoiceId_position_key" ON "SupplierInvoiceItem"("supplierInvoiceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoiceItem_supplierInvoiceId_lineIdentifier_key" ON "SupplierInvoiceItem"("supplierInvoiceId", "lineIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_reversedMovementId_key" ON "StockMovement"("reversedMovementId");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_occurredAt_idx" ON "StockMovement"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockMovement_stockItemId_occurredAt_idx" ON "StockMovement"("stockItemId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockMovement_purchaseItemId_idx" ON "StockMovement"("purchaseItemId");

-- CreateIndex
CREATE INDEX "StockMovement_workLogItemId_idx" ON "StockMovement"("workLogItemId");

-- CreateIndex
CREATE INDEX "StockMovement_reversedMovementId_idx" ON "StockMovement"("reversedMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_catalogItemId_key" ON "StockItem"("catalogItemId");

-- CreateIndex
CREATE INDEX "StockItem_tenantId_idx" ON "StockItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_tenantId_catalogItemId_key" ON "StockItem"("tenantId", "catalogItemId");

-- CreateIndex
CREATE INDEX "CatalogItem_tenantId_trackStock_idx" ON "CatalogItem"("tenantId", "trackStock");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_workLogItemId_fkey" FOREIGN KEY ("workLogItemId") REFERENCES "WorkLogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_reversedMovementId_fkey" FOREIGN KEY ("reversedMovementId") REFERENCES "StockMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
