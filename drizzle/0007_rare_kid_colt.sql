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
