CREATE TABLE `bikes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bikes_team_name_unique` ON `bikes` (`team_id`,`name`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`bike_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`slot` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_bike_date_slot_unique` ON `bookings` (`bike_id`,`date`,`slot`);--> statement-breakpoint
CREATE INDEX `bookings_team_date_idx` ON `bookings` (`team_id`,`date`);--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `detail` text;--> statement-breakpoint
ALTER TABLE `teams` ADD `api_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `teams_api_key_unique` ON `teams` (`api_key`);