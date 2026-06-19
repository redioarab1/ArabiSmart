CREATE TABLE `notebookMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`sources` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notebookMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notebookSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255),
	`sessionKey` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'محادثة جديدة',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notebookSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `notebookSessions_sessionKey_unique` UNIQUE(`sessionKey`)
);
