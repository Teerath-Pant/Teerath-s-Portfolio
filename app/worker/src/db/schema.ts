import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const createdAt = () => text('created_at').notNull().default(sql`(datetime('now'))`)
const updatedAt = () => text('updated_at').notNull().default(sql`(datetime('now'))`)

// Portfolio content. `position` keeps admin ordering stable (old tables relied on insert order).

// Single row (id = 1).
export const profile = sqliteTable('portfolio_profile', {
  id: integer('id').primaryKey(),
  name: text('name'),
  title: text('title'),
  location: text('location'),
  headline: text('headline'),
  subtext: text('subtext'),
  availableForWork: integer('available_for_work', { mode: 'boolean' }).notNull().default(true),
  avatarUrl: text('avatar_url'),
  updatedAt: updatedAt(),
})

export const goals = sqliteTable('portfolio_goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  text: text('text').notNull(),
})

export const audience = sqliteTable('portfolio_audience', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  text: text('text').notNull(),
})

export const futureEnhancements = sqliteTable('portfolio_future_enhancements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  text: text('text').notNull(),
})

export const bioPoints = sqliteTable('portfolio_bio_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  icon: text('icon'),
  label: text('label'),
  value: text('value'),
})

export const projects = sqliteTable('portfolio_projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  title: text('title').notNull(),
  description: text('description'),
  tag: text('tag'),
  link: text('link'),
  images: text('images'), // JSON array of image URLs (/api/img/<id> or https://...)
  showOnHome: integer('show_on_home', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const skillLevels = sqliteTable('portfolio_skill_levels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  label: text('label').notNull(),
  value: integer('value').notNull().default(0),
})

export const technicalMastery = sqliteTable('portfolio_technical_mastery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  title: text('title').notNull(),
  icon: text('icon'),
  skills: text('skills'), // JSON array of strings
})

export const socials = sqliteTable('portfolio_socials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  label: text('label'),
  href: text('href'),
  platform: text('platform'),
})

export const stats = sqliteTable('portfolio_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  position: integer('position').notNull().default(0),
  value: text('value'),
  label: text('label'),
})

// Visitor feedback
export const feedback = sqliteTable(
  'feedback',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    name: text('name'),
    date: text('date').notNull(), // ISO string
    createdAt: createdAt(),
  },
  (t) => [index('feedback_date_idx').on(t.date)],
)

// Messages sent through the public contact form
export const contactMessages = sqliteTable(
  'contact_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    message: text('message').notNull(),
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    notified: text('notified'), // result of the email to the owner: 'sent' | 'failed: ...' | 'skipped: ...'
    confirmation: text('confirmation'), // result of the confirmation email to the visitor (same values)
    createdAt: createdAt(),
  },
  (t) => [index('contact_messages_created_idx').on(t.createdAt)],
)

// Analytics
export const visits = sqliteTable(
  'visits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(), // YYYY-MM-DD (UTC)
    hashedIp: text('hashed_ip').notNull(), // HMAC-SHA256 hex, never the raw IP
    session: text('session').notNull(),
    country: text('country'),
    page: text('page').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('visits_date_idx').on(t.date)],
)

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(), // 'project_view' | 'contact_click'
    project: text('project'),
    platform: text('platform'),
    session: text('session').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD (UTC)
    createdAt: createdAt(),
  },
  (t) => [index('events_date_idx').on(t.date)],
)

// Key/value config (e.g. ignoredIpHash).
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: updatedAt(),
})
