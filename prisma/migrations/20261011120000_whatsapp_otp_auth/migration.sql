ALTER TABLE `users`
    ADD COLUMN `verifiedPhone` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL,
    ADD UNIQUE INDEX `users_verifiedPhone_key`(`verifiedPhone`),
    ADD INDEX `users_phone_idx`(`phone`);

CREATE TABLE `whatsapp_otp_challenges` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(16) NOT NULL,
    `purpose` ENUM('REGISTER', 'LOGIN') NOT NULL,
    `codeHash` CHAR(64) NULL,
    `userId` VARCHAR(191) NULL,
    `registrationName` VARCHAR(191) NULL,
    `registrationEmail` VARCHAR(191) NULL,
    `registrationPasswordHash` VARCHAR(191) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `resendAfter` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `authTicketHash` CHAR(64) NULL,
    `authTicketExpiresAt` DATETIME(3) NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `whatsapp_otp_challenges_authTicketHash_key`(`authTicketHash`),
    UNIQUE INDEX `whatsapp_otp_challenges_phone_purpose_key`(`phone`, `purpose`),
    INDEX `whatsapp_otp_challenges_expiresAt_idx`(`expiresAt`),
    INDEX `whatsapp_otp_challenges_userId_idx`(`userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `whatsapp_otp_challenges_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `whatsapp_otp_rate_limits` (
    `bucketKey` CHAR(64) NOT NULL,
    `windowStartedAt` DATETIME(3) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`bucketKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
