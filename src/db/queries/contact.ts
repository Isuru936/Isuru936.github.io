import { db } from '@/db';
import { contactSubmissions } from '@/db/schema';

export type NewContactSubmission = {
  name: string;
  email: string;
  message: string;
  ipHash: string | null;
};

export async function createContactSubmission(
  submission: NewContactSubmission,
): Promise<void> {
  await db.insert(contactSubmissions).values(submission);
}
