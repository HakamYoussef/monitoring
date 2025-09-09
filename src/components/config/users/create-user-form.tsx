
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/users';
import { SignupData, SignupSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type CreateUserFormProps = {
  availableDashboards: string[];
};

export function CreateUserForm({ availableDashboards }: CreateUserFormProps) {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignupData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
      accessibleDashboards: [],
    },
  });

  const onSubmit = (values: SignupData) => {
    startSavingTransition(async () => {
      const result = await createUser(values);

      if (result.success) {
        toast({ title: 'User Created', description: `Account for ${values.email} created successfully.` });
        router.push('/config');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Creation Failed', description: result.error });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} disabled={isSaving} />
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
                <Input type="password" {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accessibleDashboards"
          render={() => (
            <FormItem>
                <div className="mb-4">
                    <FormLabel className="text-base">Dashboards</FormLabel>
                    <FormDescription>
                        Select the dashboards this user will be able to access.
                    </FormDescription>
                </div>
                {availableDashboards.length > 0 ? availableDashboards.map((name) => (
                    <FormField
                        key={name}
                        control={form.control}
                        name="accessibleDashboards"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={name}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(name)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), name])
                                        : field.onChange(
                                            (field.value || [])?.filter(
                                                (value) => value !== name
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {name}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                    />
                )) : (
                    <p className="text-sm text-muted-foreground">No dashboards have been created yet. You must create a dashboard configuration first.</p>
                )}
                <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between items-center">
           <Button type="button" variant="outline" onClick={() => router.push('/config')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || availableDashboards.length === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </div>
      </form>
    </Form>
  );
}
