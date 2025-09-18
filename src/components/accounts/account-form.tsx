'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, UserSchema } from '@/lib/types';
import { createUser, updateUser } from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useRouter } from 'next/navigation';

type AccountFormProps = {
  dashboardNames: string[];
  initialUser?: Omit<User, 'password'>;
  isCreating: boolean;
};

export function AccountForm({ dashboardNames, initialUser, isCreating }: AccountFormProps) {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const router = useRouter();

  const form = useForm<User>({
    resolver: zodResolver(UserSchema),
    defaultValues:
      initialUser
        ? {
            ...initialUser,
            email: initialUser.email,
            password: '',
          }
        : {
            username: '',
            email: '',
            password: '',
            dashboardNames: [],
            role: 'user',
          },
  });

  const onSubmit = (data: User) => {
    startSavingTransition(async () => {
      const action = isCreating
        ? createUser
        : updateUser.bind(null, initialUser?.username || data.username);
      const result = await action(data);

      if (result.success) {
        toast({
          title: `User ${isCreating ? 'Created' : 'Updated'}`,
          description: `The user "${data.username}" has been ${isCreating ? 'created' : 'updated'} successfully.`,
        });
        router.push('/accounts');
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: `Error ${isCreating ? 'Creating' : 'Updating'} User`,
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" {...field} />
              </FormControl>
              <FormDescription>Used for password recovery and notifications.</FormDescription>
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
              <FormLabel>Assigned Dashboards</FormLabel>
              <FormDescription>
                The user will only be able to see these dashboards.
              </FormDescription>
              <div className="space-y-2">
                {dashboardNames.length > 0 ? (
                  dashboardNames.map((name) => (
                    <div key={name} className="flex items-center space-x-2">
                      <Checkbox
                        id={name}
                        checked={field.value?.includes(name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), name]);
                          } else {
                            field.onChange((field.value || []).filter((v: string) => v !== name));
                          }
                        }}
                      />
                      <label htmlFor={name} className="text-sm font-medium leading-none">
                        {name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No dashboards found. Please create a configuration first.</p>
                )}
              </div>
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
            {isCreating ? 'Create User' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
