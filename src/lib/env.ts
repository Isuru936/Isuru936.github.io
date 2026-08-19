import { z } from 'zod';

/**
 * Validated at module load so a misconfigured deploy fails at boot with a
 * useful message, rather than at the first database query in a request.
 */
const serverEnvSchema = z.object({
  TURSO_DATABASE_URL: z
    .string()
    .min(1, 'TURSO_DATABASE_URL is required')
    .refine(
      (value) => value.startsWith('libsql://') || value.startsWith('file:'),
      'TURSO_DATABASE_URL must start with libsql:// or file:',
    ),
  TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

function loadServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  · ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment configuration:\n${details}\n\n` +
        'Copy .env.example to .env.local and fill in the missing values.',
    );
  }

  return parsed.data;
}

export const serverEnv = loadServerEnv();
