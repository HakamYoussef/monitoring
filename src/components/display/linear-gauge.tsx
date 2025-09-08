'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type LinearGaugeProps = {
  parameter: Parameter;
};

export function LinearGauge({ parameter }: LinearGaugeProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const initialValue = 50 + (Math.random() - 0.5) * 40;
    setValue(initialValue);

    const interval = setInterval(() => {
      setValue((prevValue) => {
        const change = (Math.random() - 0.5) * 10;
        let newValue = prevValue + change;
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;
        return newValue;
      });
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  const percentage = (value / 100) * 100;
  
  const getColor = (val: number) => {
    if (val < 25) return 'bg-green-500';
    if (val < 50) return 'bg-yellow-500';
    if (val < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{parameter.name}</CardTitle>
        <CardDescription>{parameter.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 w-full rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", getColor(value))}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-right text-sm text-muted-foreground">
          {value.toFixed(1)} {parameter.unit}
        </p>
      </CardContent>
    </Card>
  );
}
