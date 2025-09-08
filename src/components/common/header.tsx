'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelsTopLeft, LogOut, User } from 'lucide-react';
import { deleteSession } from '@/lib/session';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AppHeaderProps = {
  user: {
    username: string;
    role: string;
  } | null;
};

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Display' },
    { href: '/config', label: 'Configuration', adminOnly: true },
  ];

  const handleLogout = async () => {
    await deleteSession();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <PanelsTopLeft className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">ConfigDisplay</span>
          </Link>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {navLinks.map((link) =>
              (!link.adminOnly || user?.role === 'admin') && (
                <Button
                  key={link.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    'transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              )
            )}
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
