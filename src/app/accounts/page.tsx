
'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUsers, deleteUser } from '@/actions/users';
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
import { Users, Trash2, Loader2 } from 'lucide-react';
import { User } from '@/lib/types';

export default function AccountsHubPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const userList = await getUsers();
      setUsers(userList);
      setIsLoading(false);
    };
    loadUsers();
  }, []);

  const handleDeleteClick = (username: string) => {
    setUserToDelete(username);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    startDeleteTransition(async () => {
      const result = await deleteUser(userToDelete);
      if (result.success) {
        toast({
          title: 'User Deleted',
          description: `The user "${userToDelete}" has been deleted.`,
        });
        setUsers((prev) => prev.filter((user) => user.username !== userToDelete));
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Deleting User',
          description: result.error || 'An unknown error occurred.',
        });
      }
      setDialogOpen(false);
      setUserToDelete(null);
    });
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>User Accounts</CardTitle>
                <CardDescription>
                  Manage user access to dashboards.
                </CardDescription>
              </div>
               <Button asChild>
                <Link href="/accounts/new">
                  <Users />
                  Create New User
                </Link>
              </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                <ul className="space-y-2">
                  {users.map((user) => (
                    <li key={user.username} className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground">Dashboard: {user.dashboardNames.join(', ')}</p>
                            <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => handleDeleteClick(user.username)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No users found. Create one to get started.</p>
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
              This action cannot be undone. This will permanently delete the user
              <span className="font-semibold"> &quot;{userToDelete}&quot;</span>.
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
