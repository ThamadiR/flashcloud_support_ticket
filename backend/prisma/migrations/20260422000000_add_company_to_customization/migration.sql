ALTER TABLE "customization"
ADD COLUMN IF NOT EXISTS "company_id" integer;

ALTER TABLE "customization"
ADD CONSTRAINT "customization_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companyList"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "customization_company_id_idx"
ON "customization" ("company_id");
