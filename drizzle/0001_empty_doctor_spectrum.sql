CREATE TABLE `fetchLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`status` enum('success','error') NOT NULL,
	`itemsFetched` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fetchLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`link` varchar(1024) NOT NULL,
	`image` varchar(1024),
	`source` varchar(255) NOT NULL,
	`category` enum('SE','عربية') NOT NULL,
	`language` enum('ar','sv','en') NOT NULL,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`isManual` int NOT NULL DEFAULT 0,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_link_unique` UNIQUE(`link`)
);
--> statement-breakpoint
CREATE TABLE `rssSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`category` enum('SE','عربية') NOT NULL,
	`language` enum('ar','sv','en') NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastFetchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rssSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `rssSources_url_unique` UNIQUE(`url`)
);
