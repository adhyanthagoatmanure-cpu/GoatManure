CREATE TABLE `stored_images` (
    `key` VARCHAR(255) NOT NULL,
    `body` LONGBLOB NOT NULL,
    `contentType` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stored_images_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
