
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
import { ListChecks, Trash2, Loader2, Users, UserPlus } from 'lucide-react';
import { ProtectedRoute } from '@/components/common/protected-route';
import { UserData } from '@/lib/types';
import { getUsers, deleteUser } from '@/lib/users';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


function ConfigurationHub() {
  const [configNames, setConfigNames] = useState<string[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'config' | 'user'; id: string; name: string; } | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const loadData = async () => {
      setIsLoading(true);
      const [names, userList] = await Promise.all([
          getConfigurationNames(),
          getUsers()
      ]);
      setConfigNames(names);
      setUsers(userList);
      setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteClick = (type: 'config' | 'user', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    startDeleteTransition(async () => {
      let result: { success: boolean; error?: string };
      if (itemToDelete.type === 'config') {
          result = await deleteConfiguration(itemToDelete.id);
      } else {
          result = await deleteUser(itemToDelete.id);
      }
      
      if (result.success) {
        toast({
          title: `${itemToDelete.type === 'config' ? 'Configuration' : 'User'} Deleted`,
          description: `The ${itemToDelete.type} "${itemToDelete.name}" has been deleted.`,
        });
        await loadData(); // Refresh both lists
      } else {
        toast({
          variant: 'destructive',
          title: `Error Deleting ${itemToDelete.type}`,
          description: result.error || 'An unknown error occurred.',
        });
      }
      setDialogOpen(false);
      setItemToDelete(null);
    });
  };

  return (
    <>
      <div className="container mx-auto py-10 space-y-10">
        {/* Display Configurations */}
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
                        <Button asChild variant="outline">
                          <Link href={`/config/edit/${encodeURIComponent(name)}`}>Edit</Link>
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteClick('config', name, name)}>
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

        {/* User Accounts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
             <div>
                <CardTitle>User Accounts</CardTitle>
                <CardDescription>
                  Manage users and their dashboard access.
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/config/users/new">
                  <UserPlus />
                  Create New User
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Accessible Dashboards</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.accessibleDashboards.join(', ')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="destructive" onClick={() => handleDeleteClick('user', user.id, user.email)}>
                                        <Trash2 />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : (
                 <p className="text-muted-foreground">No users found. Create one to get started.</p>
              )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-semibold"> &quot;{itemToDelete?.name}&quot; </span>
              {itemToDelete?.type}.
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
