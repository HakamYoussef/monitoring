'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ListChecks } from 'lucide-react';
import Link from 'next/link';

export function DashboardSelector() {
  const { user } = useAuth();

  if (!user || !user.accessibleDashboards || user.accessibleDashboards.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold">No Dashboards Available</h2>
        <p className="mt-2 text-muted-foreground">
          You do not have access to any dashboards. Please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select a Dashboard</CardTitle>
        <CardDescription>
          Choose one of the dashboards you have access to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {user.accessibleDashboards.map((name) => (
            <li key={name}>
              <Link
                href={`/dashboard/${encodeURIComponent(name)}`}
                className="block rounded-md border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <ListChecks className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-lg">{name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
