import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { projectViews } from '@/db/schema';

/**
 * Atomic upsert-and-increment. Done in one statement so concurrent views can't
 * clobber each other with a read-modify-write race.
 */
export async function incrementProjectView(slug: string): Promise<void> {
  await db
    .insert(projectViews)
    .values({ slug, count: 1, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: projectViews.slug,
      set: {
        count: sql`${projectViews.count} + 1`,
        updatedAt: new Date(),
      },
    });
}

export async function getProjectViewCount(slug: string): Promise<number> {
  const [row] = await db
    .select({ count: projectViews.count })
    .from(projectViews)
    .where(eq(projectViews.slug, slug))
    .limit(1);

  return row?.count ?? 0;
}
