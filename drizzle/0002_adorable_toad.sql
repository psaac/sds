ALTER TABLE `players` RENAME COLUMN "photoDataUrl" TO "photoPath";--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games_drafts` (
	`game_type` text(20) PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY NOT NULL,
	`game_type` text(20) NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text NOT NULL,
	`winner_player_id` integer,
	`winner_name` text,
	`players_json` text NOT NULL,
	`config_json` text,
	`metadata_json` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`winner_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
