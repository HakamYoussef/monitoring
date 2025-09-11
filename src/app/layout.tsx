import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/common/header';
import { Toaster } from "@/components/ui/toaster";
import { getSession } from '@/actions/session';
import { isMongoConfigured } from '@/lib/mongodb';

export const metadata: Metadata = {
  title: 'Smart Monitoring',
  description: 'Configure and display your parameters dynamically.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isDbConnected = isMongoConfigured();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
            <div className="relative flex min-h-screen flex-col">
                {(session.isLoggedIn || !isDbConnected) && <AppHeader session={session} />}
                <main className="flex-1">{children}</main>
            </div>
            <Toaster />
      </body>
    </html>
  );
}
