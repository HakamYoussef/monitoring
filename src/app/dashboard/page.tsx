import { getConfigurationNames } from '@/actions/config';
import { ProtectedRoute } from '@/components/common/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import Link from 'next/link';

async function DashboardPage() {
    const dashboardNames = await getConfigurationNames();

  if (!dashboardNames || dashboardNames.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold">No Dashboards Available</h2>
        <p className="mt-2 text-muted-foreground">
          Please create a dashboard configuration first.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select a Dashboard</CardTitle>
        <CardDescription>
          Choose one of the available dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {dashboardNames.map((name) => (
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

export default function () {
    return (
        <ProtectedRoute>
          <div className="container mx-auto py-10">
            <DashboardPage />
          </div>
        </ProtectedRoute>
    )
}
