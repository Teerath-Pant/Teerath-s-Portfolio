import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Example Schema: Projects Table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 1024 }),
  link: varchar('link', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admins Table
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 256 }).notNull().unique(),
  password: varchar('password', { length: 256 }).notNull(), // Should be hashed in production
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Analytics: Visits Table
export const visits = pgTable('visits', {
  id: serial('id').primaryKey(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  hashedIp: varchar('hashed_ip', { length: 64 }).notNull(),
  session: varchar('session', { length: 64 }).notNull(),
  country: varchar('country', { length: 10 }),
  page: varchar('page', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Analytics: Events Table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 64 }).notNull(), // 'project_view', 'contact_click'
  project: varchar('project', { length: 256 }),
  platform: varchar('platform', { length: 64 }),
  session: varchar('session', { length: 64 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// Feedback Table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  name: varchar('name', { length: 256 }),
  date: varchar('date', { length: 64 }).notNull(), // ISO string
  createdAt: timestamp('created_at').defaultNow(),
});

// Settings Table (for simple key-value config like ignoredIpHash)
export const settings = pgTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────
// PORTFOLIO TABLES (Tabular Storage)
// ─────────────────────────────────────────────────────────

export const portfolioProfile = pgTable('portfolio_profile', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
  title: varchar('title', { length: 256 }),
  location: varchar('location', { length: 256 }),
  headline: varchar('headline', { length: 256 }),
  subtext: text('subtext'),
  availableForWork: boolean('available_for_work').default(true),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
});

export const portfolioGoals = pgTable('portfolio_goals', {
  id: serial('id').primaryKey(),
  text: varchar('text', { length: 1024 }).notNull(),
});

export const portfolioAudience = pgTable('portfolio_audience', {
  id: serial('id').primaryKey(),
  text: varchar('text', { length: 1024 }).notNull(),
});

export const portfolioBioPoints = pgTable('portfolio_bio_points', {
  id: serial('id').primaryKey(),
  icon: varchar('icon', { length: 32 }),
  label: varchar('label', { length: 128 }),
  value: varchar('value', { length: 256 }),
});

export const portfolioProjects = pgTable('portfolio_projects', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description'),
  tag: varchar('tag', { length: 128 }),
  link: varchar('link', { length: 1024 }),
  images: text('images'), // JSON array of image URLs
  showOnHome: boolean('show_on_home').default(false),
});

export const portfolioSkillLevels = pgTable('portfolio_skill_levels', {
  id: serial('id').primaryKey(),
  label: varchar('label', { length: 128 }).notNull(),
  value: integer('value').default(0),
});

export const portfolioTechnicalMastery = pgTable('portfolio_technical_mastery', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  icon: varchar('icon', { length: 64 }),
  skills: text('skills'), // JSON string array of skills
});

export const portfolioFutureEnhancements = pgTable('portfolio_future_enhancements', {
  id: serial('id').primaryKey(),
  text: varchar('text', { length: 1024 }).notNull(),
});

export const portfolioSocials = pgTable('portfolio_socials', {
  id: serial('id').primaryKey(),
  label: varchar('label', { length: 128 }),
  href: varchar('href', { length: 1024 }),
  platform: varchar('platform', { length: 64 }),
});

export const portfolioStats = pgTable('portfolio_stats', {
  id: serial('id').primaryKey(),
  value: varchar('value', { length: 64 }),
  label: varchar('label', { length: 256 }),
});
