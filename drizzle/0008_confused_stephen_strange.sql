CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100) NOT NULL,
	`icon` varchar(50),
	`color` varchar(20),
	`order` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `newsCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnail` varchar(1024),
	`channelId` varchar(50) NOT NULL,
	`channelTitle` varchar(255) NOT NULL,
	`publishedAt` timestamp NOT NULL,
	`duration` varchar(20),
	`viewCount` int DEFAULT 0,
	`language` enum('ar','sv','en') NOT NULL,
	`category` enum('SE','عربية') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `videos_videoId_unique` UNIQUE(`videoId`)
);
--> statement-breakpoint
CREATE TABLE `youtubeChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` varchar(50) NOT NULL,
	`channelTitle` varchar(255) NOT NULL,
	`channelUrl` varchar(1024) NOT NULL,
	`thumbnail` varchar(1024),
	`language` enum('ar','sv','en') NOT NULL,
	`category` enum('SE','عربية') NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastFetchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtubeChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtubeChannels_channelId_unique` UNIQUE(`channelId`)
);
