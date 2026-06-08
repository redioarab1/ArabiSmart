CREATE INDEX `idx_news_publishedAt` ON `news` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `idx_news_category` ON `news` (`category`);--> statement-breakpoint
CREATE INDEX `idx_news_language` ON `news` (`language`);--> statement-breakpoint
CREATE INDEX `idx_news_source` ON `news` (`source`);--> statement-breakpoint
CREATE INDEX `idx_news_category_lang` ON `news` (`category`,`language`);