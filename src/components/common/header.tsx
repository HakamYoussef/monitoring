
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PanelsTopLeft } from 'lucide-react';
import { LocationTime } from './location-time';
import { UserNav } from './user-nav';
import { useSession } from '@/hooks/use-session';


export function AppHeader() {
  const pathname = usePathname();
  const { session } = useSession();
  
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/config', label: 'Configuration' },
    { href: '/accounts', label: 'Accounts' },
  ];

  // If not logged in and no DB, don't show the header
  if (!session?.isLoggedIn && !process.env.NEXT_PUBLIC_IS_DEMO) {
      const isDbConfigured = !!process.env.MONGODB_URI;
      if (isDbConfigured) return null;
  }


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-6 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <PanelsTopLeft className="h-6 w-6 text-primary" />
            <span className="font-bold">Smart Monitoring</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname.startsWith(link.href) ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
            <LocationTime />
            <UserNav />
        </div>
      </div>
    </header>
  );
}
