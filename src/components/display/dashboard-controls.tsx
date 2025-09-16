'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useParameterData } from '@/hooks/use-parameter-data';
import type { Control, Parameter } from '@/lib/types';

interface DashboardControlsProps {
  controls: Control[];
  parameters: Parameter[];
}

function ThresholdControl({ control, parameter }: { control: Control; parameter: Parameter }) {
  const { data: value } = useParameterData(parameter, 0);
  const numericValue = typeof value === 'number' ? value : value?.value;
  const threshold = control.threshold;
  const { toast } = useToast();
  const isActive =
    typeof numericValue === 'number' && threshold !== undefined
      ? numericValue >= threshold
      : false;

  useEffect(() => {
    if (isActive) {
      toast({
        variant: 'destructive',
        title: 'Alert',
        description: `${parameter.name} reached ${numericValue?.toFixed(1)} ${parameter.unit}`,
      });
    }
  }, [isActive, numericValue, parameter.name, parameter.unit, threshold, toast]);

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`control-${control.id}`}>{control.label || 'Threshold'}</Label>
        <Button id={`control-${control.id}`} variant={isActive ? 'destructive' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {typeof numericValue === 'number'
          ? `Current value: ${numericValue.toFixed(1)} ${parameter.unit ?? ''}`
          : 'Waiting for data...'}
      </p>
      {typeof threshold === 'number' && (
        <p className="text-xs text-muted-foreground">Threshold: {threshold}</p>
      )}
    </div>
  );
}

function ToggleControl({ control }: { control: Control }) {
  const [isEnabled, setIsEnabled] = useState(control.defaultState ?? false);
  const { toast } = useToast();

  const handleChange = (checked: boolean) => {
    setIsEnabled(checked);
    toast({
      title: control.label || 'Toggle',
      description: `Switched ${checked ? 'on' : 'off'}.`,
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor={`control-${control.id}`}>{control.label || 'Toggle'}</Label>
        <p className="text-sm text-muted-foreground">{isEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>
      <Switch id={`control-${control.id}`} checked={isEnabled} onCheckedChange={handleChange} />
    </div>
  );
}

function RefreshControl({ control }: { control: Control }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="font-medium">{control.label || 'Refresh'}</p>
        <p className="text-sm text-muted-foreground">Trigger a manual refresh.</p>
      </div>
      <Button variant="secondary">{control.label || 'Refresh'}</Button>
    </div>
  );
}

export function DashboardControls({ controls, parameters }: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!controls.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isOpen ? 'default' : 'outline'} aria-pressed={isOpen}>
          Control Panel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Control Panel</DialogTitle>
          <DialogDescription>Interact with dashboard controls.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {controls.map((control) => {
            switch (control.type) {
              case 'refresh':
                return <RefreshControl key={control.id} control={control} />;
              case 'threshold': {
                const parameter = parameters.find((p) => p.id === control.parameterId);
                if (!parameter) return null;
                return <ThresholdControl key={control.id} control={control} parameter={parameter} />;
              }
              case 'toggle':
                return <ToggleControl key={control.id} control={control} />;
              default:
                return null;
            }
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
