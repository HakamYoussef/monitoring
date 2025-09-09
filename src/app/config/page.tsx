
'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getConfigurationNames, deleteConfiguration } from '@/actions/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Trash2, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/common/protected-route';

function ConfigurationHub() {
  const [configNames, setConfigNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadConfigNames = async () => {
      setIsLoading(true);
      const names = await getConfigurationNames();
      setConfigNames(names);
      setIsLoading(false);
    };
    loadConfigNames();
  }, []);

  const handleDeleteClick = (name: string) => {
    setConfigToDelete(name);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!configToDelete) return;

    startDeleteTransition(async () => {
      const result = await deleteConfiguration(configToDelete);
      if (result.success) {
        toast({
          title: 'Configuration Deleted',
          description: `The configuration "${configToDelete}" has been deleted.`,
        });
        setConfigNames((prev) => prev.filter((name) => name !== configToDelete));
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Deleting Configuration',
          description: result.error || 'An unknown error occurred.',
        });
      }
      setDialogOpen(false);
      setConfigToDelete(null);
    });
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Display Configurations</CardTitle>
                <CardDescription>
                  Manage your display configurations for dashboards.
                </CardDescription>
              </div>
               <Button asChild>
                <Link href="/config/new">
                  <ListChecks />
                  Create New Configuration
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>Loading configurations...</p>
                </div>
              ) : configNames.length > 0 ? (
                <ul className="space-y-2">
                  {configNames.map((name) => (
                    <li key={name} className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-primary" />
                        <span className="font-medium">{name}</span>
                      </div>
                      <div className="flex gap-2">
                         <Button asChild variant="secondary">
                          <Link href={`/dashboard/${encodeURIComponent(name)}`}>View</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/config/edit/${encodeURIComponent(name)}`}>Edit</Link>
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteClick(name)}>
                          <Trash2 />
                        </Button>
                      </div>
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

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-semibold"> &quot;{configToDelete}&quot; </span>
              configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ConfigurationHubPage() {
    return (
        <ProtectedRoute>
            <ConfigurationHub />
        </ProtectedRoute>
    )
}
