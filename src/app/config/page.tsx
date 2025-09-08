import { getConfigurationNames } from '@/actions/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, ListChecks } from 'lucide-react';
import Link from 'next/link';

export default async function ConfigurationHubPage() {
  const configNames = await getConfigurationNames();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Display Configuration Hub</CardTitle>
          <CardDescription>
            Manage your display configurations. You can create a new one or edit an existing one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-start">
            <Button asChild>
              <Link href="/config/new">Create New Configuration</Link>
            </Button>
          </div>
          
          <div className='space-y-4'>
            <h3 className="text-xl font-semibold">Existing Configurations</h3>
            {configNames.length > 0 ? (
              <ul className="space-y-2">
                {configNames.map((name) => (
                  <li key={name} className="flex items-center justify-between rounded-md border p-4">
                     <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-primary" />
                      <span className="font-medium">{name}</span>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/config/edit/${encodeURIComponent(name)}`}>
                        Edit
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No configurations found. Create one to get started.</p>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}