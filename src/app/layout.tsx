import type { Metadata } from 'next';

import { jetbrainsMono, spaceGrotesk } from '@/lib/fonts';

import './globals.css';

export const metadata: Metadata = {
  title: 'Isuru Bandara — Software Engineer',
  description:
    '.NET full stack developer. Web applications with .NET on the backend, React, Next.js and TypeScript on the frontend, and PostgreSQL underneath.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
