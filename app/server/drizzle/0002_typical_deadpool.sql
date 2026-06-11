ALTER TABLE "portfolio_profile" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "portfolio_projects" ADD COLUMN "show_on_home" boolean DEFAULT false;