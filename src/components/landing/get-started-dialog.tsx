'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/branding';

const InquiryFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Please enter your full name.' }),
  company: z.string().min(2, { message: 'Please enter your company or organization.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phoneNumber : z.string().max(13, {message: 'Please entre you phone number'}),
  projectDescription: z
    .string()
    .min(10, { message: 'Share a short description so we can prepare the right next steps.' })
    .max(500, { message: 'Keep the description under 500 characters.' }),
});

type InquiryFormValues = z.infer<typeof InquiryFormSchema>;

type GetStartedDialogProps = {
  triggerClassName?: string;
};

export function GetStartedDialog({ triggerClassName }: GetStartedDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(InquiryFormSchema),
    defaultValues: {
      fullName: '',
      company: '',
      email: '',
      phoneNumber: '',
      projectDescription: '',
    },
  });

  const onSubmit = (values: InquiryFormValues) => {
    setIsSubmitting(true);

    try {
      const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'touati.hakam.youssef@gmail.com';
      const subject = encodeURIComponent(`${APP_NAME} Project Inquiry`);
      const body = encodeURIComponent(
        [
          `Full Name: ${values.fullName}`,
          `Company: ${values.company}`,
          `Email: ${values.email}`,
          `Phone: ${values.phoneNumber}`,
          '',
          'Project Description:',
          values.projectDescription,
        ].join('\n'),
      );

      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    } finally {
      form.reset();
      setIsSubmitting(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={cn('gap-2', triggerClassName)}>
          <Mail className="h-5 w-5" />
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tell us about your project</DialogTitle>
          <DialogDescription>
            Share a few details so we can prepare a tailored onboarding experience. After submitting, your email app will open
            with the information pre-filled.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company or Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="Where do you work?" autoComplete="organization" {...field} />
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
                  <FormLabel>Work Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+212 xxx-xxx-xxx" autoComplete="Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Overview</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share the monitoring challenge you want to solve." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setIsOpen(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                <span>{isSubmitting ? 'Preparing email…' : 'Send details'}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

