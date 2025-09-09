import { getConfiguration } from '@/actions/config';
import { ProtectedRoute } from '@/components/common/protected-route';
import { WidgetGrid } from '@/components/display/widget-grid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type DisplayDashboardPageProps = {
  params: {
    name: string;
  };
};

async function DisplayDashboard({ params }: DisplayDashboardPageProps) {
  const configName = decodeURIComponent(params.name);
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
      <WidgetGrid parameters={config.parameters} />
    </div>
  );
}


export default function DisplayDashboardPage({ params }: DisplayDashboardPageProps) {
    return (
        <ProtectedRoute>
            <DisplayDashboard params={params} />
        </ProtectedRoute>
    )
}
