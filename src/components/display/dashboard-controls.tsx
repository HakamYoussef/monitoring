'use client';

import { startTransition, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useParameterData } from '@/hooks/use-parameter-data';
import { cn } from '@/lib/utils';
import type { Control, Parameter } from '@/lib/types';
import { setControlState } from '@/actions/control-events';
import type { ControlStateSnapshot } from '@/actions/control-events';

interface DashboardControlsProps {
  controls: Control[];
  parameters: Parameter[];
  controlStates?: Record<string, ControlStateSnapshot>;
}

function coerceFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return undefined;
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function getNumericValue(value: unknown): number | undefined {
  const directNumber = coerceFiniteNumber(value);
  if (directNumber !== undefined) {
    return directNumber;
  }

  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const itemValue = getNumericValue(value[index]);
      if (itemValue !== undefined) {
        return itemValue;
      }
    }
    return undefined;
  }

  if (value && typeof value === 'object' && 'value' in value) {
    const nestedRaw = (value as { value?: unknown }).value;
    const nestedValue = coerceFiniteNumber(nestedRaw);
    if (nestedValue !== undefined) {
      return nestedValue;
    }

    if (nestedRaw && nestedRaw !== value) {
      return getNumericValue(nestedRaw);
    }
  }

  return undefined;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'off', 'no'].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function ThresholdControl({ control, parameter }: { control: Control; parameter: Parameter }) {
  const { data: rawValue } = useParameterData(parameter, null);
  const numericValue = getNumericValue(rawValue);
  const threshold = coerceFiniteNumber(control.threshold);
  const { toast } = useToast();
  const isActive =
    numericValue !== undefined && threshold !== undefined ? numericValue >= threshold : false;

  useEffect(() => {
    if (isActive && numericValue !== undefined && threshold !== undefined) {
      toast({
        variant: 'destructive',
        title: 'Alert',
        description: `${parameter.name} reached ${numericValue?.toFixed(1)} ${parameter.unit ?? ''}`,
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
        {numericValue !== undefined
          ? `Current value: ${numericValue.toFixed(1)} ${parameter.unit ?? ''}`
          : 'Waiting for data...'}
      </p>
      {typeof threshold === 'number' && (
        <p className="text-xs text-muted-foreground">Threshold: {threshold}</p>
      )}
    </div>
  );
}

function ToggleControl({ control, state }: { control: Control; state?: ControlStateSnapshot }) {
  const [isEnabled, setIsEnabled] = useState(() =>
    coerceBoolean(state?.value, control.defaultState ?? false),
  );
  const { toast } = useToast();

  const handleChange = (checked: boolean) => {
    const previousValue = isEnabled;
    const optimisticValue = checked;
    const label = control.label || 'Toggle';

    setIsEnabled(optimisticValue);

    startTransition(() => {
      setControlState({ controlId: control.id, type: control.type, value: optimisticValue })
        .then((result) => {
          const resolvedValue = coerceBoolean(result.state?.value, optimisticValue);
          setIsEnabled(resolvedValue);

          if (result.success) {
            toast({
              title: label,
              description: `Switched ${resolvedValue ? 'on' : 'off'}.`,
            });
            return;
          }

          toast({
            variant: 'destructive',
            title: `${label} failed`,
            description: result.error ?? 'Unable to update control state.',
          });
        })
        .catch((error) => {
          console.error(`Failed to set control state for ${control.id}:`, error);
          setIsEnabled(previousValue);
          toast({
            variant: 'destructive',
            title: `${label} failed`,
            description:
              error instanceof Error
                ? error.message
                : 'Unable to communicate with the device.',
          });
        });
    });
  };

  useEffect(() => {
    if (state) {
      setIsEnabled(coerceBoolean(state.value, control.defaultState ?? false));
    }
  }, [control.defaultState, state?.updatedAt, state?.value]);

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

function RefreshControl({ control, state }: { control: Control; state?: ControlStateSnapshot }) {
  const [isActive, setIsActive] = useState(() => coerceBoolean(state?.value, false));
  const { toast } = useToast();

  const handleClick = () => {
    const previousValue = isActive;
    const optimisticValue = !isActive;
    const label = control.label || 'Refresh';

    setIsActive(optimisticValue);

    startTransition(() => {
      setControlState({ controlId: control.id, type: control.type, value: optimisticValue })
        .then((result) => {
          const resolvedValue = coerceBoolean(result.state?.value, optimisticValue);
          setIsActive(resolvedValue);

          if (!result.success) {
            toast({
              variant: 'destructive',
              title: `${label} failed`,
              description: result.error ?? 'Unable to update control state.',
            });
          }
        })
        .catch((error) => {
          console.error(`Failed to update refresh control ${control.id}:`, error);
          setIsActive(previousValue);
          toast({
            variant: 'destructive',
            title: `${label} failed`,
            description:
              error instanceof Error
                ? error.message
                : 'Unable to communicate with the device.',
          });
        });
    });
  };

  useEffect(() => {
    if (state) {
      setIsActive(coerceBoolean(state.value, false));
    }
  }, [state?.updatedAt, state?.value]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="font-medium">{control.label || 'Refresh'}</p>
        <p className="text-sm text-muted-foreground">Trigger a manual refresh.</p>
      </div>
      <Button
        aria-pressed={isActive}
        className={cn(
          'text-white',
          isActive
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-red-600 hover:bg-red-500'
        )}
        onClick={handleClick}
        variant="secondary"
      >
        {isActive ? 'Active' : 'Inactive'}
      </Button>
    </div>
  );
}

export function DashboardControls({ controls, parameters, controlStates }: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!controls.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Control Panel</Button>
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
                return (
                  <RefreshControl
                    key={control.id}
                    control={control}
                    state={controlStates?.[control.id]}
                  />
                );
              case 'threshold': {
                const parameter = parameters.find((p) => p.id === control.parameterId);
                if (!parameter) return null;
                return <ThresholdControl key={control.id} control={control} parameter={parameter} />;
              }
              case 'toggle':
                return (
                  <ToggleControl
                    key={control.id}
                    control={control}
                    state={controlStates?.[control.id]}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
