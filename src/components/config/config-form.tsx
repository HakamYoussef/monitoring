'use client';

import { useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Config, ConfigSchema } from '@/lib/types';
import { createConfiguration, saveConfiguration } from '@/actions/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useRouter } from 'next/navigation';

type ConfigFormProps = {
  initialConfig?: Config;
  isCreating: boolean;
};

export function ConfigForm({ initialConfig, isCreating }: ConfigFormProps) {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const router = useRouter();

  const form = useForm<Config>({
    resolver: zodResolver(ConfigSchema),
    defaultValues:
      initialConfig ||
      {
        name: '',
        parameters: [],
      },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parameters',
  });

  const onSubmit = (data: Config) => {
    startSavingTransition(async () => {
      const action = isCreating ? createConfiguration : saveConfiguration;
      const result = await action(data);

      if (result.success) {
        toast({
          title: 'Configuration Saved',
          description: `The configuration "${data.name}" has been saved successfully.`,
        });
        // Redirect to the hub page after saving
        router.push('/config');
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Saving Configuration',
          description: result.error || 'An unknown error occurred.',
        });
      }
    });
  };

  const handleAddParameter = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      unit: '',
      description: '',
      displayType: 'stat',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Configuration Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Dashboard" {...field} disabled={!isCreating} />
              </FormControl>
              <FormDescription>
                A unique name for this set of parameters. Cannot be changed after creation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader>
                <CardTitle>Parameter #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`parameters.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Temperature" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`parameters.${index}.unit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., °C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`parameters.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the parameter..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`parameters.${index}.displayType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a display type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stat">Stat Card</SelectItem>
                          <SelectItem value="radial-gauge">Radial Gauge</SelectItem>
                          <SelectItem value="linear-gauge">Linear Gauge</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="progress">Progress Bar</SelectItem>
                          <SelectItem value="status-light">Status Light</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="button" variant="outline" onClick={handleAddParameter}>
            <Plus className="mr-2 h-4 w-4" />
            Add Parameter
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
           <Button type="button" variant="outline" onClick={() => router.push('/config')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Create Configuration' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}