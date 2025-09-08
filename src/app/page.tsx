import { getConfiguration } from '@/actions/config';
import { WidgetGrid } from '@/components/display/widget-grid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DisplayPage() {
  const config = await getConfiguration();
  const { parameters, name } = config;

  if (parameters.length === 0) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">No Parameters Configured</h2>
          <p className="mt-2 text-muted-foreground">
            Go to the configuration page to add parameters to display.
          </p>
          <Button asChild className="mt-6">
            <Link href="/config">Go to Configuration</Link>
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
