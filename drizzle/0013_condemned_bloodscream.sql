CREATE TABLE `liveChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`channelId` varchar(255) NOT NULL,
	`youtubeUrl` varchar(1024) NOT NULL,
	`fallbackVideoId` varchar(255),
	`logo` varchar(10) NOT NULL DEFAULT '📺',
	`color` varchar(20) NOT NULL DEFAULT '#ef4444',
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liveChannels_id` PRIMARY KEY(`id`)
);
