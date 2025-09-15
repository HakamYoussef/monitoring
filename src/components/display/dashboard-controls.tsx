'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
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
  const { toast } = useToast();
  const isActive =
    typeof numericValue === 'number' && control.threshold !== undefined
      ? numericValue >= control.threshold
      : false;

  useEffect(() => {
    if (isActive) {
      toast({
        variant: 'destructive',
        title: 'Alert',
        description: `${parameter.name} reached ${numericValue?.toFixed(1)} ${parameter.unit}`,
      });
    }
  }, [isActive, numericValue, parameter.name, parameter.unit, toast]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={`control-${control.id}`}>{control.label || 'Threshold'}</Label>
        <Button id={`control-${control.id}`} variant={isActive ? 'destructive' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Button>
      </div>
    </div>
  );
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
              return (
                <Button key={control.id} variant="secondary">
                  {control.label || 'Refresh'}
                </Button>
              );
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
