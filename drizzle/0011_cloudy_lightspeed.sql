CREATE TABLE `archivedNews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`archivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `archivedNews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`content` text NOT NULL,
	`isApproved` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailySummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`summary` text NOT NULL,
	`topNews` text,
	`trendingTopics` text,
	`statistics` text,
	`language` enum('ar','sv','en') NOT NULL DEFAULT 'ar',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailySummaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailySummaries_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `folderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folderId` int NOT NULL,
	`newsId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `folderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
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
CREATE TABLE `newsCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `podcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` int NOT NULL,
	`audioUrl` varchar(1024) NOT NULL,
	`duration` int,
	`language` enum('ar','sv','en') NOT NULL,
	`status` enum('generating','ready','failed') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `podcasts_id` PRIMARY KEY(`id`),
	CONSTRAINT `podcasts_newsId_unique` UNIQUE(`newsId`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
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
