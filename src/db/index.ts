import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import { serverEnv } from '@/lib/env';

import * as schema from './schema';

const client = createClient({
  url: serverEnv.TURSO_DATABASE_URL,
  authToken: serverEnv.TURSO_AUTH_TOKEN,
});

/**
 * Only `src/db/queries/` may import this. Everything else calls a typed query
 * function, so the SQL surface stays in one reviewable place.
 */
export const db = drizzle(client, { schema });
