CREATE TABLE `archivedNews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`archivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `archivedNews_id` PRIMARY KEY(`id`)
);
