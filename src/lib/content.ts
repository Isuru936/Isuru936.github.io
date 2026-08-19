import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';
import { z } from 'zod';

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects');

const frontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  stack: z.array(z.string()).min(1),
  cover: z.string().min(1),
  featured: z.boolean().default(false),
});

export type ProjectFrontmatter = z.infer<typeof frontmatterSchema>;
export type Project = ProjectFrontmatter & { slug: string; body: string };

/**
 * Invalid frontmatter throws, which fails `next build`. A half-rendered project
 * page is worse than a build that tells you which file is wrong.
 */
async function readProject(fileName: string): Promise<Project> {
  const slug = fileName.replace(/\.mdx$/, '');
  const raw = await readFile(path.join(PROJECTS_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);

  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid frontmatter in content/projects/${fileName} — ${details}`);
  }

  return { ...parsed.data, slug, body: content };
}

export async function getAllProjects(): Promise<Project[]> {
  const entries = await readdir(PROJECTS_DIR);
  const projects = await Promise.all(
    entries.filter((entry) => entry.endsWith('.mdx')).map(readProject),
  );

  return projects.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export async function getProjectSlugs(): Promise<string[]> {
  const entries = await readdir(PROJECTS_DIR);
  return entries.filter((entry) => entry.endsWith('.mdx')).map((entry) => entry.replace(/\.mdx$/, ''));
}

export async function getProject(slug: string): Promise<Project | null> {
  try {
    return await readProject(`${slug}.mdx`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
