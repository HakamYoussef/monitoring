'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, UserSchema } from '@/lib/types';
import { createUser } from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useRouter } from 'next/navigation';

type AccountFormProps = {
  dashboardNames: string[];
};

export function AccountForm({ dashboardNames }: AccountFormProps) {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const router = useRouter();

  const form = useForm<User>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      username: '',
      password: '',
      dashboardNames: [],
      role: 'user',
    },
  });

  const onSubmit = (data: User) => {
    startSavingTransition(async () => {
      const result = await createUser(data);

      if (result.success) {
        toast({
          title: 'User Created',
          description: `The user "${data.username}" has been created successfully.`,
        });
        router.push('/accounts');
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Creating User',
          description: result.error || 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="e.g., new.user" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
               <FormDescription>
                Must be at least 6 characters long.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dashboardNames"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Dashboard</FormLabel>
              <Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value[0]}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dashboard to assign" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dashboardNames.length > 0 ? (
                    dashboardNames.map(name => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">No dashboards found. Please create a configuration first.</div>
                  )}
                </SelectContent>
              </Select>
               <FormDescription>
                The user will only be able to see these dashboards.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines the level of access for this user.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between items-center">
           <Button type="button" variant="outline" onClick={() => router.push('/accounts')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || dashboardNames.length === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </div>
      </form>
    </Form>
  );
}
