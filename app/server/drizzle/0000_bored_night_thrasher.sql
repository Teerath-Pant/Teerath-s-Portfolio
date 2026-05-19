CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(64) NOT NULL,
	"project" varchar(256),
	"platform" varchar(64),
	"session" varchar(64) NOT NULL,
	"date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"name" varchar(256),
	"date" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_audience" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(1024) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_bio_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"icon" varchar(32),
	"label" varchar(128),
	"value" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "portfolio_future_enhancements" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(1024) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(1024) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"title" varchar(256),
	"location" varchar(256),
	"headline" varchar(256),
	"subtext" text,
	"available_for_work" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "portfolio_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"tag" varchar(128),
	"link" varchar(1024),
	"images" text
);
--> statement-breakpoint
CREATE TABLE "portfolio_skill_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(128) NOT NULL,
	"value" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "portfolio_socials" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(128),
	"href" varchar(1024),
	"platform" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "portfolio_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar(64),
	"label" varchar(256)
);
--> statement-breakpoint
CREATE TABLE "portfolio_technical_mastery" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"icon" varchar(64),
	"skills" text
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"image_url" varchar(1024),
	"link" varchar(1024),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"hashed_ip" varchar(64) NOT NULL,
	"session" varchar(64) NOT NULL,
	"country" varchar(10),
	"page" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
