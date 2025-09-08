import { getConfiguration } from '@/actions/config';
import { getSession } from '@/lib/session';
import { WidgetGrid } from '@/components/display/widget-grid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DisplayPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // For a 'user' role, the project name from the session is used.
  // For an 'admin' role, project is undefined, so the default/first config is loaded.
  const config = await getConfiguration(session.project);
  const { parameters, name } = config;

  if (parameters.length === 0) {
    const isAdmin = session.role === 'admin';
    return (
      <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">
            {isAdmin ? 'No Parameters Configured' : `No Parameters for "${name}"`}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {isAdmin 
              ? 'Go to the configuration page to add parameters to display.'
              : 'Contact an administrator to configure this project.'
            }
          </p>
          {isAdmin && (
            <Button asChild className="mt-6">
              <Link href="/config">Go to Configuration</Link>
            </Button>
          )}
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
