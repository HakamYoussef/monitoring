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
import {
  Cpu,
  Thermometer,
  MemoryStick,
  HardDrive,
  Network,
  Battery,
  Power,
  Info,
  BarChart,
  LineChart,
  Gauge,
  Type,
  Lightbulb,
  Loader2,
  Plus,
  Trash2,
  LucideProps,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Sunrise,
  Mountain,
  Compass,
  Umbrella,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useRouter } from 'next/navigation';
import { FC, forwardRef } from 'react';

type ConfigFormProps = {
  initialConfig?: Config;
  isCreating: boolean;
};

// Map of icon names to Lucide components
const iconMap: { [key: string]: FC<LucideProps> } = {
  Cpu,
  Thermometer,
  MemoryStick,
  HardDrive,
  Network,
  Battery,
  Power,
  Info,
  BarChart,
  LineChart,
  Gauge,
  Type,
  Lightbulb,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Sunrise,
  Mountain,
  Compass,
  Umbrella,
};

// A component to render the icon in the select list
const IconDisplay = forwardRef<HTMLDivElement, { iconName: string }>(({ iconName, ...props }, ref) => {
  const Icon = iconMap[iconName];
  if (!Icon) return null;
  return (
    <div ref={ref} {...props} className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      <span>{iconName}</span>
    </div>
  );
});
IconDisplay.displayName = 'IconDisplay';

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
        controls: [],
      },
  });

  const { fields: parameterFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parameters',
  });

  const { fields: controlFields, append: appendControl, remove: removeControl } = useFieldArray({
    control: form.control,
    name: 'controls',
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

  // Generate a unique id for a new parameter. Some environments (or older
  // browsers) don't provide `crypto.randomUUID`, which previously resulted in a
  // runtime error when adding a parameter. We fall back to a simple random
  // string in those cases.
  const generateId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
  };

  const handleAddParameter = () => {
    append({
      id: generateId(),
      name: '',
      unit: '',
      description: '',
      displayType: 'stat',
      icon: 'Info', // Default icon
    });
  };

  const handleAddControl = () => {
    appendControl({
      id: generateId(),
      type: 'refresh',
      label: '',
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
          {parameterFields.map((field, index) => (
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
                 <FormField
                  control={form.control}
                  name={`parameters.${index}.icon`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon">
                              {field.value && <IconDisplay iconName={field.value} />}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(iconMap).sort().map(iconName => (
                            <SelectItem key={iconName} value={iconName}>
                              <IconDisplay iconName={iconName} />
                            </SelectItem>
                          ))}
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

        <div className="space-y-4 mt-8">
          {controlFields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader>
                <CardTitle>Control #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`controls.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === 'threshold') {
                              form.setValue(
                                `controls.${index}.parameterId`,
                                form.getValues(`controls.${index}.parameterId`) ?? ''
                              );
                              const currentThreshold = form.getValues(
                                `controls.${index}.threshold`
                              );
                              const parsedThreshold =
                                typeof currentThreshold === 'number'
                                  ? currentThreshold
                                  : Number(currentThreshold);
                              form.setValue(
                                `controls.${index}.threshold`,
                                Number.isNaN(parsedThreshold) ? 0 : parsedThreshold
                              );
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select control type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="refresh">Refresh Button</SelectItem>
                            <SelectItem value="threshold">Threshold Input</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`controls.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Label" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch(`controls.${index}.type`) === 'threshold' && (
                  <>
                    <FormField
                      control={form.control}
                      name={`controls.${index}.parameterId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parameter</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select parameter" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {parameterFields.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name || 'Unnamed'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`controls.${index}.threshold`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Threshold</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-destructive hover:text-destructive"
                  onClick={() => removeControl(index)}
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
          <Button type="button" variant="outline" onClick={handleAddControl}>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
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
