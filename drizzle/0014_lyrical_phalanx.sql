ALTER TABLE `liveChannels` ADD `streamType` varchar(10) DEFAULT 'youtube' NOT NULL;--> statement-breakpoint
ALTER TABLE `liveChannels` ADD `m3u8Url` varchar(2048);