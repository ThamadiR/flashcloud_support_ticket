-- MySQL schema equivalent to previous Prisma/Postgres schema

CREATE TABLE `Management` (
  `userId` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userName` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `contactNo` VARCHAR(255),
  `role` ENUM('ADMIN', 'NON_ADMIN') NOT NULL DEFAULT 'NON_ADMIN',
  `img` VARCHAR(255),
  PRIMARY KEY (`userId`)
);

CREATE TABLE `companyList` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `email` VARCHAR(255),
  `tenant_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `customization_subsectionss` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `servers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `label` VARCHAR(100),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companyList`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE `customization` ADD COLUMN IF NOT EXISTS `company_id` INT UNSIGNED;
ALTER TABLE `customization` ADD CONSTRAINT `customization_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companyList`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS `customization_company_id_idx` ON `customization` (`company_id`);
