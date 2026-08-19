'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';

import { createContactSubmission } from '@/db/queries/contact';
import { checkRateLimit } from '@/lib/rate-limit';

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const submissionSchema = z.object({
  name: z.string().trim().min(1, 'Tell me your name').max(120),
  email: z.email('That email address does not look right'),
  message: z.string().trim().min(10, 'A little more detail, please').max(4000),
  /** Hidden field. Humans leave it empty; bots fill it in. */
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<'name' | 'email' | 'message', string>>;
};

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export async function submitContact(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = submissionSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    website: formData.get('website') ?? '',
  });

  // Honeypot tripped: behave like success so the mechanism isn't advertised.
  if (!parsed.success && parsed.error.issues.some((issue) => issue.path[0] === 'website')) {
    return { status: 'success', message: 'Thanks — your message is on its way.' };
  }

  if (!parsed.success) {
    const fieldErrors: ContactFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'name' || field === 'email' || field === 'message') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors };
  }

  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const { allowed, retryAfterMs } = checkRateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return {
      status: 'error',
      message: `That is a lot of messages. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    };
  }

  try {
    await createContactSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      ipHash: ip === 'unknown' ? null : hashIp(ip),
    });
  } catch (error) {
    console.error('[contact] failed to store submission', error);
    return {
      status: 'error',
      message: 'Something broke on my end. Email me directly if this keeps happening.',
    };
  }

  return { status: 'success', message: 'Thanks — your message is on its way.' };
}
