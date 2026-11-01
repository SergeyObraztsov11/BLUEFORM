-- Existing orders predate delivery details, so their fields remain null.
ALTER TABLE "orders"
  ADD COLUMN "deliveryCity" TEXT,
  ADD COLUMN "deliveryAddress" TEXT,
  ADD COLUMN "deliveryPostalCode" TEXT,
  ADD COLUMN "deliveryComment" TEXT;
