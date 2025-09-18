'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import { startTransition, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useParameterData } from '@/hooks/use-parameter-data';
import { cn } from '@/lib/utils';
import type { Control, Parameter } from '@/lib/types';
import { setControlState } from '@/actions/control-events';
import type { ControlStateSnapshot } from '@/actions/control-events';

interface DashboardControlsProps {
  dashboardName: string;
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

function ThresholdControl({
  dashboardName,
  control,
  parameter,
  state,
}: {
  dashboardName: string;
  control: Control;
  parameter: Parameter;
  state?: ControlStateSnapshot;
}) {
  const { data: rawValue } = useParameterData(dashboardName, parameter, null);
  const numericValue = getNumericValue(rawValue);
  const initialThreshold = coerceFiniteNumber(state?.value ?? control.threshold);
  const [currentThreshold, setCurrentThreshold] = useState<number | undefined>(initialThreshold);
  const [draftThreshold, setDraftThreshold] = useState<number | undefined>(initialThreshold);
  const [isSaving, setIsSaving] = useState(false);
  const previousActiveRef = useRef(false);
  const { toast } = useToast();
  const unitSuffix = parameter.unit ? ` ${parameter.unit}` : '';
  const isActive =
    numericValue !== undefined && currentThreshold !== undefined
      ? numericValue >= currentThreshold
      : false;

  useEffect(() => {
    setCurrentThreshold(initialThreshold);
    setDraftThreshold(initialThreshold);
  }, [initialThreshold]);

  useEffect(() => {
    const wasActive = previousActiveRef.current;

    if (isActive && !wasActive && numericValue !== undefined && currentThreshold !== undefined) {
      toast({
        variant: 'destructive',
        title: 'Alert',
        description: `${parameter.name} reached ${numericValue.toFixed(1)}${unitSuffix}`,
      });
    }

    previousActiveRef.current = isActive;
  }, [currentThreshold, isActive, numericValue, parameter.name, unitSuffix, toast]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.valueAsNumber;
    setDraftThreshold(Number.isFinite(nextValue) ? nextValue : undefined);
  };

  const resetDraft = () => {
    setDraftThreshold(currentThreshold);
  };

  const hasChanges = (draftThreshold ?? null) !== (currentThreshold ?? null);

  const handleSave = () => {
    if (!hasChanges) {
      return;
    }

    const label = control.label || 'Threshold';
    const previousValue = currentThreshold;
    const pendingValue = draftThreshold;

    setIsSaving(true);
    startTransition(() => {
      setControlState({
        dashboardName,
        controlId: control.id,
        type: control.type,
        value: pendingValue ?? null,
      })
        .then((result) => {
          setIsSaving(false);
          const resolvedValue = coerceFiniteNumber(result.state?.value);
          const nextValue = resolvedValue ?? (pendingValue ?? undefined);

          if (!result.success) {
            setDraftThreshold(previousValue);
            toast({
              variant: 'destructive',
              title: `${label} update failed`,
              description: result.error ?? 'Unable to update threshold value.',
            });
            return;
          }

          setCurrentThreshold(nextValue);
          setDraftThreshold(nextValue);
          toast({
            title: label,
            description:
              nextValue !== undefined
                ? `Threshold set to ${nextValue.toFixed(1)}${unitSuffix}.`
                : 'Threshold cleared.',
          });
        })
        .catch((error) => {
          console.error(`Failed to update threshold control ${control.id}:`, error);
          setIsSaving(false);
          setDraftThreshold(previousValue);
          toast({
            variant: 'destructive',
            title: `${label} update failed`,
            description:
              error instanceof Error
                ? error.message
                : 'Unable to communicate with the device.',
          });
        });
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      resetDraft();
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`control-${control.id}`}>{control.label || 'Threshold'}</Label>
        <Button id={`control-${control.id}`} variant={isActive ? 'destructive' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {numericValue !== undefined
          ? `Current value: ${numericValue.toFixed(1)}${unitSuffix}`
          : 'Waiting for data...'}
      </p>
      <div className="space-y-2">
        <Label htmlFor={`control-${control.id}-threshold-input`} className="text-sm font-medium">
          Threshold value
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id={`control-${control.id}-threshold-input`}
            type="number"
            inputMode="decimal"
            value={draftThreshold ?? ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-describedby={`control-${control.id}-threshold-help`}
            disabled={isSaving}
          />
          <Button onClick={handleSave} variant="secondary" disabled={!hasChanges || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
        <p
          id={`control-${control.id}-threshold-help`}
          className="text-xs text-muted-foreground"
        >
          {currentThreshold !== undefined
            ? `Alerts trigger when ${parameter.name} is at or above ${currentThreshold.toFixed(1)}${unitSuffix}.`
            : 'Set a threshold to receive alerts for this parameter.'}
          {hasChanges && ' (Unsaved changes)'}
        </p>
      </div>
    </div>
  );
}

function ToggleControl({
  dashboardName,
  control,
  state,
}: {
  dashboardName: string;
  control: Control;
  state?: ControlStateSnapshot;
}) {
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
      setControlState({
        dashboardName,
        controlId: control.id,
        type: control.type,
        value: optimisticValue,
      })
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
  }, [control.defaultState, state]);

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

function RefreshControl({
  dashboardName,
  control,
  state,
}: {
  dashboardName: string;
  control: Control;
  state?: ControlStateSnapshot;
}) {
  const [isActive, setIsActive] = useState(() => coerceBoolean(state?.value, false));
  const { toast } = useToast();

  const handleClick = () => {
    const previousValue = isActive;
    const optimisticValue = !isActive;
    const label = control.label || 'Refresh';

    setIsActive(optimisticValue);

    startTransition(() => {
      setControlState({
        dashboardName,
        controlId: control.id,
        type: control.type,
        value: optimisticValue,
      })
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
  }, [state]);

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

export function DashboardControls({
  dashboardName,
  controls,
  parameters,
  controlStates,
}: DashboardControlsProps) {
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
                    dashboardName={dashboardName}
                    key={control.id}
                    control={control}
                    state={controlStates?.[control.id]}
                  />
                );
              case 'threshold': {
                const parameter = parameters.find((p) => p.id === control.parameterId);
                if (!parameter) return null;
                return (
                  <ThresholdControl
                    dashboardName={dashboardName}
                    key={control.id}
                    control={control}
                    parameter={parameter}
                    state={controlStates?.[control.id]}
                  />
                );
              }
              case 'toggle':
                return (
                  <ToggleControl
                    dashboardName={dashboardName}
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
