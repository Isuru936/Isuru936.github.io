import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * View counts per project slug. Eventually consistent by design — a lost
 * increment is acceptable, a failed page render is not.
 */
export const projectViews = sqliteTable('project_views', {
  slug: text('slug').primaryKey(),
  count: integer('count').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Contact form submissions. `ipHash` is a hash, never a raw address — it exists
 * for abuse handling only.
 */
export const contactSubmissions = sqliteTable(
  'contact_submissions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull(),
    message: text('message').notNull(),
    ipHash: text('ip_hash'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('contact_submissions_created_at_idx').on(table.createdAt)],
);

export type ProjectView = typeof projectViews.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
