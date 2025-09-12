import { getConfiguration } from '@/actions/config';
import { getSession } from '@/actions/session';
import { WidgetGrid } from '@/components/display/widget-grid';
import { DashboardControls } from '@/components/display/dashboard-controls';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type DisplayDashboardPageProps = {
  params: Promise<{
    name: string;
  }>;
};

export default async function DisplayDashboardPage({ params }: DisplayDashboardPageProps) {
  const { name } = await params;
  const configName = decodeURIComponent(name);
  const session = await getSession();

  if (session.role !== 'admin' && !session.dashboardNames.includes(configName)) {
    redirect('/dashboard');
  }

  const config = await getConfiguration(configName);

  if (config.parameters.length === 0) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">No Parameters in &quot;{config.name}&quot;</h2>
          <p className="mt-2 text-muted-foreground">
            Go to the configuration page to add parameters to this display.
          </p>
          <Button asChild className="mt-6">
            <Link href={`/config/edit/${encodeURIComponent(config.name)}`}>Go to Configuration</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{config.name}</h1>
         <Button asChild variant="outline">
            <Link href="/dashboard">Switch Dashboard</Link>
        </Button>
      </div>
      <DashboardControls controls={config.controls} parameters={config.parameters} />
      <WidgetGrid parameters={config.parameters} />
    </div>
  );
}
