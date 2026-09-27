CREATE TABLE `blog_comments` (
    `id` VARCHAR(191) NOT NULL,
    `blogPostId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorEmail` VARCHAR(191) NOT NULL,
    `comment` TEXT NOT NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `blog_comments_blogPostId_createdAt_idx` (`blogPostId`, `createdAt`),
    CONSTRAINT `blog_comments_blogPostId_fkey` FOREIGN KEY (`blogPostId`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
