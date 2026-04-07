CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(128),
	`action` varchar(128) NOT NULL,
	`entity` varchar(64),
	`entityId` int,
	`details` text,
	`ip` varchar(64),
	`status` enum('success','error') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pageViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`page` varchar(255) NOT NULL,
	`referrer` varchar(512),
	`userAgent` varchar(512),
	`ip` varchar(64),
	`country` varchar(64),
	`userId` int,
	`sessionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pageViews_id` PRIMARY KEY(`id`)
);
