-- DropForeignKey
ALTER TABLE `blog_images` DROP FOREIGN KEY `blog_images_blog_id_fkey`;

-- DropIndex
DROP INDEX `blog_images_blog_id_fkey` ON `blog_images`;

-- AddForeignKey
ALTER TABLE `blog_images` ADD CONSTRAINT `blog_images_blog_id_fkey` FOREIGN KEY (`blog_id`) REFERENCES `blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
