CREATE TABLE `dailyWrapUp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`language` enum('ar','sv','en') NOT NULL DEFAULT 'ar',
	`headlines` text NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyWrapUp_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyWrapUp_date_unique` UNIQUE(`date`)
);
