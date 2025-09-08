'use client';

import { useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Config, ConfigSchema, Parameter } from '@/lib/types';
import { saveConfiguration } from '@/actions/config';
import { suggestConfiguration } from '@/ai/flows/suggest-configuration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

type ConfigFormProps = {
  initialConfig: Config;
};

export function ConfigForm({ initialConfig }: ConfigFormProps) {
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const [isSuggesting, startSuggestingTransition] = useTransition();

  const form = useForm<Config>({
    resolver: zodResolver(ConfigSchema),
    defaultValues: initialConfig,
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'parameters',
  });

  const onSubmit = (data: Config) => {
    startSavingTransition(async () => {
      const result = await saveConfiguration(data);
      if (result.success) {
        toast({
          title: 'Configuration Saved',
          description: 'Your display configuration has been updated successfully.',
        });
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

  const handleSuggestConfig = () => {
    const currentParams = form.getValues('parameters');
    if(currentParams.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Parameters',
        description: 'Please add at least one parameter before suggesting a configuration.',
      });
      return;
    }
    
    startSuggestingTransition(async () => {
      try {
        const suggestion = await suggestConfiguration({
          parameters: currentParams.map(({ name, unit, description }) => ({ name: name || '', unit: unit || '', description: description || '' })),
        });
        
        suggestion.configuration.forEach((suggestedParam, index) => {
          if (index < currentParams.length) {
            const displayType = suggestedParam.displayType.toLowerCase().includes('gauge') ? 'gauge' 
              : suggestedParam.displayType.toLowerCase().includes('line') ? 'line'
              : 'stat';

            update(index, {
              ...currentParams[index],
              displayType: displayType as Parameter['displayType'],
            });
          }
        });

        toast({
          title: 'Configuration Suggested',
          description: 'AI has suggested a new display configuration.',
        });

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'AI Suggestion Failed',
          description: 'Could not get suggestions. Please try again.',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                          <SelectItem value="gauge">Gauge Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
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
          <Button type="button" onClick={handleSuggestConfig} disabled={isSuggesting || fields.length === 0}>
            {isSuggesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Suggest with AI
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </form>
    </Form>
  );
}
