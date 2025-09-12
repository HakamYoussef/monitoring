'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Control, Parameter } from '@/lib/types';
import { useParameterData } from '@/hooks/use-parameter-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DashboardControlsProps {
  controls: Control[];
  parameters: Parameter[];
}

export function DashboardControls({ controls, parameters }: DashboardControlsProps) {
  if (!controls.length) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        {controls.map((control) => {
          switch (control.type) {
            case 'refresh':
              return <RefreshControl key={control.id} control={control} />;
            case 'threshold':
              const parameter = parameters.find((p) => p.id === control.parameterId);
              if (!parameter) return null;
              return <ThresholdControl key={control.id} control={control} parameter={parameter} />;
            default:
              return null;
          }
        })}
      </CardContent>
    </Card>
  );
}

function RefreshControl({ control }: { control: Control }) {
  const [active, setActive] = useState(false);

  return (
    <Button
      variant="secondary"
      className={cn(active && 'bg-green-600 text-white hover:bg-green-700')}
      onClick={() => setActive((prev) => !prev)}
    >
      {control.label || 'Refresh'}
    </Button>
  );
}

interface ThresholdControlProps {
  control: Control;
  parameter: Parameter;
}

function ThresholdControl({ control, parameter }: ThresholdControlProps) {
  const { toast } = useToast();
  const { data } = useParameterData(parameter);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [notified, setNotified] = useState(false);

  const value = typeof data === 'number' ? data : data?.value;

  useEffect(() => {
    if (threshold === null || value === undefined) return;
    if (value >= threshold && !notified) {
      toast({
        title: `${parameter.name} threshold reached`,
        description: `${value.toFixed ? value.toFixed(1) : value} ≥ ${threshold}`,
      });
      setNotified(true);
    } else if (value < threshold && notified) {
      setNotified(false);
    }
  }, [value, threshold, notified, toast, parameter.name]);

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={`control-${control.id}`}>{control.label || parameter.name}</Label>
      <Input
        id={`control-${control.id}`}
        type="number"
        className="w-24"
        placeholder="0"
        value={threshold ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          setThreshold(val ? parseFloat(val) : null);
        }}
      />
    </div>
  );
}

