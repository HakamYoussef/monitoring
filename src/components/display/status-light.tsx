'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type StatusLightProps = {
  parameter: Parameter;
};

export function StatusLight({ parameter }: StatusLightProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const initialValue = Math.random() * 100;
    setValue(initialValue);

    const interval = setInterval(() => {
        setValue(Math.random() * 100);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Example thresholds: 0-33: OK, 34-66: Warning, 67-100: Alert
  const getStatus = (val: number) => {
    if (val < 33) return { label: 'OK', color: 'bg-green-500', shadow: 'shadow-[0_0_12px_4px] shadow-green-500/70' };
    if (val < 67) return { label: 'Warning', color: 'bg-yellow-500', shadow: 'shadow-[0_0_12px_4px] shadow-yellow-500/70' };
    return { label: 'Alert', color: 'bg-red-500', shadow: 'shadow-[0_0_12px_4px] shadow-red-500/70' };
  };

  const status = getStatus(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{parameter.name}</CardTitle>
        <CardDescription>{parameter.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="relative h-24 w-24">
            <div className={cn("h-full w-full rounded-full", status.color, status.shadow)} />
        </div>
        <p className="font-semibold text-lg">{status.label}</p>
        <p className="text-sm text-muted-foreground">
            {value.toFixed(1)} {parameter.unit}
        </p>
      </CardContent>
    </Card>
  );
}
