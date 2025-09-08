import { getConfiguration, getConfigurationNames } from '@/actions/config';
import { WidgetGrid } from '@/components/display/widget-grid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DisplayPage() {
  const configNames = await getConfigurationNames();

  if (configNames.length === 0) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-10rem)] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold">No Configurations Found</h2>
        <p className="mt-2 text-muted-foreground">
          Go to the configuration page to create a display configuration.
        </p>
        <Button asChild className="mt-6">
          <Link href="/config">Go to Configuration</Link>
        </Button>
      </div>
    );
  }

  // For demonstration, display the first available configuration.
  // In a real app, you might let the user choose which one to display.
  const firstConfigName = configNames[0];
  const config = await getConfiguration(firstConfigName);
  const { parameters, name } = config;

  if (parameters.length === 0) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">No Parameters in &quot;{name}&quot;</h2>
          <p className="mt-2 text-muted-foreground">
            Go to the configuration page to add parameters to this display.
          </p>
          <Button asChild className="mt-6">
            <Link href={`/config/edit/${encodeURIComponent(name)}`}>Go to Configuration</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">{name}</h1>
      <WidgetGrid parameters={parameters} />
    </div>
  );
}