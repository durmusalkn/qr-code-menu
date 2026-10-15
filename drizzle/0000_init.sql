CREATE TABLE `backup_log` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text NOT NULL,
	`files_copied` integer DEFAULT 0 NOT NULL,
	`bytes_copied` integer DEFAULT 0 NOT NULL,
	`error` text,
	CONSTRAINT "backup_log_status_valid" CHECK(status IN ('running', 'success', 'error'))
);
--> statement-breakpoint
CREATE INDEX `backup_log_started_at_idx` ON `backup_log` (`started_at`);--> statement-breakpoint
CREATE TABLE `location_points` (
	`id` text PRIMARY KEY NOT NULL,
	`recorded_at` integer NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`accuracy` real,
	`altitude` real,
	`speed` real
);
--> statement-breakpoint
CREATE INDEX `location_points_recorded_at_idx` ON `location_points` (`recorded_at`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`kind` text NOT NULL,
	`rel_path` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`duration_ms` integer,
	`width` integer,
	`height` integer,
	`thumbnail_rel_path` text,
	`gallery_asset_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "media_kind_valid" CHECK(kind IN ('photo', 'video', 'audio'))
);
--> statement-breakpoint
CREATE INDEX `media_moment_id_idx` ON `media` (`moment_id`);--> statement-breakpoint
CREATE INDEX `media_created_at_idx` ON `media` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_rel_path_unique` ON `media` (`rel_path`);--> statement-breakpoint
CREATE TABLE `moments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`note` text,
	`mood` integer,
	`starred` integer DEFAULT false NOT NULL,
	`source` text NOT NULL,
	`prompt_id` text,
	`lat` real,
	`lng` real,
	`accuracy` real,
	`place_name` text,
	`weather_code` integer,
	`temperature_c` real,
	CONSTRAINT "moments_mood_range" CHECK(mood IS NULL OR mood BETWEEN 1 AND 10),
	CONSTRAINT "moments_source_valid" CHECK(source IN ('quick_capture', 'prompt', 'in_app'))
);
--> statement-breakpoint
CREATE INDEX `moments_created_at_idx` ON `moments` (`created_at`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`scheduled_for` integer NOT NULL,
	`notification_id` text,
	`delivered_at` integer,
	`responded_at` integer,
	`response_moment_id` text,
	CONSTRAINT "prompts_kind_valid" CHECK(kind IN ('mood', 'activity', 'photo'))
);
--> statement-breakpoint
CREATE INDEX `prompts_scheduled_for_idx` ON `prompts` (`scheduled_for`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`place_name` text,
	`arrived_at` integer NOT NULL,
	`departed_at` integer
);
--> statement-breakpoint
CREATE INDEX `visits_arrived_at_idx` ON `visits` (`arrived_at`);