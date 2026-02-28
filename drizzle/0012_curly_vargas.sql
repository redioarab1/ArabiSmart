CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`videoId` varchar(255) NOT NULL,
	`thumbnail` varchar(1024),
	`channelId` int,
	`channelName` varchar(255),
	`language` enum('ar','sv','en') NOT NULL DEFAULT 'ar',
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`isManual` int NOT NULL DEFAULT 0,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `videos_videoId_unique` UNIQUE(`videoId`)
);
--> statement-breakpoint
CREATE TABLE `youtubeChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`channelId` varchar(255) NOT NULL,
	`language` enum('ar','sv','en') NOT NULL DEFAULT 'ar',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtubeChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtubeChannels_channelId_unique` UNIQUE(`channelId`)
);
