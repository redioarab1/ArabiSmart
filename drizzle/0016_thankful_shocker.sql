CREATE TABLE `autoArchiveLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`archivedCount` int NOT NULL DEFAULT 0,
	`olderThanDays` int NOT NULL DEFAULT 7,
	`status` enum('success','error') NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `autoArchiveLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsTranslations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` int NOT NULL,
	`language` enum('en','sv') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`translatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsTranslations_id` PRIMARY KEY(`id`)
);
