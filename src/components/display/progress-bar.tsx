'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

type ProgressBarProps = {
  parameter: Parameter;
};

export function ProgressBar({ parameter }: ProgressBarProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(50);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{parameter.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={value} />
        <p className="text-right text-sm text-muted-foreground">
          {value.toFixed(1)} {parameter.unit}
        </p>
      </CardContent>
    </Card>
  );
}
