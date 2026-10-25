ALTER TABLE `orders`
    ADD COLUMN `customerWhatsAppNotificationAttemptedAt` DATETIME(3) NULL,
    ADD COLUMN `adminWhatsAppNotificationAttemptedAt` DATETIME(3) NULL;
