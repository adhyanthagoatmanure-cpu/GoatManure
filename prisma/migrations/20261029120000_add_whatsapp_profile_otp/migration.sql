ALTER TABLE `whatsapp_otp_challenges`
MODIFY COLUMN `purpose` ENUM('REGISTER', 'LOGIN', 'PROFILE') NOT NULL;
