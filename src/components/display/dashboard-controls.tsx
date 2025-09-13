'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useParameterData } from '@/hooks/use-parameter-data';
import type { Control, Parameter } from '@/lib/types';

interface DashboardControlsProps {
  controls: Control[];
  parameters: Parameter[];
}

export function DashboardControls({ controls, parameters }: DashboardControlsProps) {
  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});

  if (!controls.length) return null;

  const toggleButton = (id: string) => {
    setActiveButtons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        {controls.map((control) => {
          switch (control.type) {
            case 'refresh': {
              const isActive = activeButtons[control.id];
              return (
                <Button
                  key={control.id}
                  variant={isActive ? 'default' : 'secondary'}
                  aria-pressed={isActive}
                  onClick={() => toggleButton(control.id)}
                >
                  {control.label || 'Refresh'}
                </Button>
              );
            }
            case 'threshold':
              return (
                <ThresholdControl
                  key={control.id}
                  controlId={control.id}
                  label={control.label}
                  parameters={parameters}
                />
              );
            default:
              return null;
          }
        })}
      </CardContent>
    </Card>
  );
}

function ThresholdControl({
  controlId,
  label,
  parameters,
}: {
  controlId: string;
  label?: string;
  parameters: Parameter[];
}) {
  const { toast } = useToast();
  const [selectedParamId, setSelectedParamId] = useState(parameters[0]?.id ?? '');
  const [threshold, setThreshold] = useState<number>(0);
  const [alerted, setAlerted] = useState(false);
  const parameter = parameters.find((p) => p.id === selectedParamId);
  const { data } = useParameterData(parameter!, null);

  const currentValue = typeof data === 'number' ? data : data?.value;

  useEffect(() => {
    if (parameter && threshold && currentValue !== undefined && currentValue >= threshold && !alerted) {
      toast({
        title: 'Threshold reached',
        description: `${parameter.name} has reached ${currentValue.toFixed?.(1) ?? currentValue}`,
      });
      setAlerted(true);
    }
  }, [parameter, threshold, currentValue, alerted, toast]);

  useEffect(() => {
    setAlerted(false);
  }, [threshold, selectedParamId]);

  if (!parameters.length) return null;

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedParamId} onValueChange={(val) => setSelectedParamId(val)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Parameter" />
        </SelectTrigger>
        <SelectContent>
          {parameters.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label htmlFor={`control-${controlId}`} className="sr-only">
        {label || 'Threshold'}
      </Label>
      <Input
        id={`control-${controlId}`}
        type="number"
        className="w-24"
        placeholder="0"
        value={threshold ? threshold : ''}
        onChange={(e) => setThreshold(Number(e.target.value))}
      />
    </div>
  );
}
