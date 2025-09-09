'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PanelsTopLeft } from 'lucide-react';
import { LocationTime } from './location-time';
import { useAuth } from '@/context/auth-context';
import { Button } from '../ui/button';

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = user ? [
    { href: '/', label: 'Dashboard' },
    { href: '/config', label: 'Configuration' },
  ] : [];

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
                pathname === link.href ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
            <LocationTime />
            {user ? (
                <Button variant="outline" onClick={logout}>Logout</Button>
            ) : (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
}
