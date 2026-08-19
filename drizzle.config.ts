import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Read .env.local the same way Next.js does, so drizzle-kit and the app agree.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
