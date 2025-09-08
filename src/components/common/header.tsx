'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PanelsTopLeft, LayoutDashboard, Settings } from 'lucide-react';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '../ui/sidebar';


export function AppHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Display', icon: LayoutDashboard },
    { href: '/config', label: 'Configuration', icon: Settings },
  ];

  return (
    <>
      <Sidebar>
        <div className="flex flex-col h-full p-4">
          <Link href="/" className="mb-6 flex items-center space-x-2">
              <PanelsTopLeft className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ConfigDisplay</span>
          </Link>

          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <Link href={link.href}>
                   <SidebarMenuButton isActive={pathname === link.href} tooltip={link.label}>
                    <link.icon/>
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </Sidebar>
      <SidebarInset>
         <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <div className="flex-1">
                <div className="hidden md:flex items-center space-x-2">
                  <PanelsTopLeft className="h-6 w-6 text-primary" />
                  <span className="font-bold">ConfigDisplay</span>
                </div>
              </div>
            </div>
          </header>
      </SidebarInset>
    </>
  );
}
