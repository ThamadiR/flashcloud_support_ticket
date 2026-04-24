-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'NON_ADMIN');

-- CreateTable
CREATE TABLE "Management" (
    "userId" SMALLSERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "contactNo" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'NON_ADMIN',
    "img" TEXT,

    CONSTRAINT "Management_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "companyList" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "email" VARCHAR(255),
    "tenant_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companyList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customization_subsectionss" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customization_subsectionss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customization" (
    "id" SERIAL NOT NULL,
    "subsection_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_servers" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "ip_address" INET NOT NULL,
    "label" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_servers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Management_Email_key" ON "Management"("Email");

-- AddForeignKey
ALTER TABLE "customization" ADD CONSTRAINT "customization_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "customization_subsectionss"("id") ON DELETE SET NULL ON UPDATE CASCADE;
