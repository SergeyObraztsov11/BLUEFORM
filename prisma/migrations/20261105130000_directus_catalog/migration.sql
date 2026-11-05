-- Directus writes directly to these existing tables; Prisma normally fills these values itself.
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text, ALTER COLUMN "slug" SET DEFAULT gen_random_uuid()::text, ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "product_colorways" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text, ALTER COLUMN "slug" SET DEFAULT gen_random_uuid()::text, ALTER COLUMN "sizeSystemId" SET DEFAULT '', ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "skus" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text, ALTER COLUMN "skuCode" SET DEFAULT gen_random_uuid()::text, ALTER COLUMN "sizeSystemId" SET DEFAULT '', ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Directus cannot discover composite relations. These additional keys expose the same
-- relationships in the editor; the original composite keys still enforce size-system consistency.
ALTER TABLE "product_colorways" ADD CONSTRAINT "colorway_product_directus_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skus" ADD CONSTRAINT "sku_colorway_directus_fkey" FOREIGN KEY ("colorwayId") REFERENCES "product_colorways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skus" ADD CONSTRAINT "sku_size_directus_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "directus_catalog_defaults"() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'product_colorways' THEN
    SELECT "sizeSystemId" INTO NEW."sizeSystemId" FROM "products" WHERE "id" = NEW."productId";
  ELSIF TG_TABLE_NAME = 'skus' THEN
    SELECT "sizeSystemId" INTO NEW."sizeSystemId" FROM "product_colorways" WHERE "id" = NEW."colorwayId";
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW."updatedAt" := CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "directus_product_defaults" BEFORE INSERT OR UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION "directus_catalog_defaults"();
CREATE TRIGGER "directus_colorway_defaults" BEFORE INSERT OR UPDATE ON "product_colorways" FOR EACH ROW EXECUTE FUNCTION "directus_catalog_defaults"();
CREATE TRIGGER "directus_sku_defaults" BEFORE INSERT OR UPDATE ON "skus" FOR EACH ROW EXECUTE FUNCTION "directus_catalog_defaults"();
