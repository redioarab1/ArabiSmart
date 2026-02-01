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
