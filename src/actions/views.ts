'use server';

import { incrementProjectView } from '@/db/queries/views';

/**
 * Fire-and-forget. A view count is not worth failing a page render for, so
 * database errors are logged and swallowed.
 */
export async function recordProjectView(slug: string): Promise<void> {
  try {
    await incrementProjectView(slug);
  } catch (error) {
    console.error(`[views] failed to record view for "${slug}"`, error);
  }
}
