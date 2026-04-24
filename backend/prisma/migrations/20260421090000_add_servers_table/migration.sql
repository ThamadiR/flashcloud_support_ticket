-- CreateTable
CREATE TABLE "servers" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "ip_address" INET NOT NULL,
    "label" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companyList"("id") ON DELETE CASCADE ON UPDATE CASCADE;