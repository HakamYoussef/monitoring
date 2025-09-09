'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/auth-context';
import { SignupData, SignupSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

type SignupFormProps = {
  availableDashboards: string[];
};

export function SignupForm({ availableDashboards }: SignupFormProps) {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
      accessibleDashboards: [],
    },
  });

  const onSubmit = async (values: SignupData) => {
    setIsLoading(true);
    const result = await signup(values);

    if (result.success) {
      toast({ title: 'Account Created', description: "Welcome! You've been logged in." });
    } else {
      toast({ variant: 'destructive', title: 'Signup Failed', description: result.error });
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} disabled={isLoading} />
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
                <Input type="password" {...field} disabled={isLoading} />
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
                        Select the dashboards you want to access with this account.
                    </FormDescription>
                </div>
                {availableDashboards.map((name) => (
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
                ))}
                <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
        </div>
      </form>
    </Form>
  );
}
