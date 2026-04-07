CREATE TABLE `breakingNews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`url` text,
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breakingNews_id` PRIMARY KEY(`id`)
);
