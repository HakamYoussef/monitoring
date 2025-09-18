'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestPasswordReset } from '@/actions/password-reset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [hasRequested, setHasRequested] = useState(false);
  const [isRequesting, startTransition] = useTransition();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    startTransition(async () => {
      const result = await requestPasswordReset(values);

      if (result.success) {
        setHasRequested(true);
        toast({
          title: 'Check your email',
          description: result.message ?? 'If an account exists for that email, you will receive a password reset link shortly.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Request failed',
          description: result.error ?? 'Unable to request a password reset. Please try again.',
        });
      }
    });
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
                <Input type="email" placeholder="name@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isRequesting || hasRequested}>
          {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {hasRequested ? 'Email sent' : 'Send reset link'}
        </Button>
      </form>
    </Form>
  );
}
