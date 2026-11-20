CREATE TABLE `portfolio_audience` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_bio_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`icon` text,
	`label` text,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`project` text,
	`platform` text,
	`session` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `events` (`date`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`name` text,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_date_idx` ON `feedback` (`date`);--> statement-breakpoint
CREATE TABLE `portfolio_future_enhancements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`title` text,
	`location` text,
	`headline` text,
	`subtext` text,
	`available_for_work` integer DEFAULT true NOT NULL,
	`avatar_url` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tag` text,
	`link` text,
	`images` text,
	`show_on_home` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_skill_levels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`label` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_socials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`label` text,
	`href` text,
	`platform` text
);
--> statement-breakpoint
CREATE TABLE `portfolio_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`value` text,
	`label` text
);
--> statement-breakpoint
CREATE TABLE `portfolio_technical_mastery` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`icon` text,
	`skills` text
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`hashed_ip` text NOT NULL,
	`session` text NOT NULL,
	`country` text,
	`page` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visits_date_idx` ON `visits` (`date`);