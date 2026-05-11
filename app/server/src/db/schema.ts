import { mysqlTable, int, varchar, text, timestamp } from 'drizzle-orm/mysql-core';

// Example Schema: Projects Table
export const projects = mysqlTable('projects', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 1024 }),
  link: varchar('link', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Admins Table
export const admins = mysqlTable('admins', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 256 }).notNull().unique(),
  password: varchar('password', { length: 256 }).notNull(), // Should be hashed in production
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Analytics: Visits Table
export const visits = mysqlTable('visits', {
  id: int('id').primaryKey().autoincrement(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  hashedIp: varchar('hashed_ip', { length: 64 }).notNull(),
  session: varchar('session', { length: 64 }).notNull(),
  country: varchar('country', { length: 10 }),
  page: varchar('page', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Analytics: Events Table
export const events = mysqlTable('events', {
  id: int('id').primaryKey().autoincrement(),
  type: varchar('type', { length: 64 }).notNull(), // 'project_view', 'contact_click'
  project: varchar('project', { length: 256 }),
  platform: varchar('platform', { length: 64 }),
  session: varchar('session', { length: 64 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// Feedback Table
export const feedback = mysqlTable('feedback', {
  id: int('id').primaryKey().autoincrement(),
  rating: int('rating').notNull(),
  comment: text('comment'),
  name: varchar('name', { length: 256 }),
  date: varchar('date', { length: 64 }).notNull(), // ISO string
  createdAt: timestamp('created_at').defaultNow(),
});

// Settings Table (for simple key-value config like ignoredIpHash)
export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
