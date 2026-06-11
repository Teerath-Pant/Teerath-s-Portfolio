ALTER TABLE "portfolio_projects"
ADD COLUMN IF NOT EXISTS "show_on_home" boolean DEFAULT false;
