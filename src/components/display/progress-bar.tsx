'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ProgressBarProps = {
  parameter: Parameter;
};

export function ProgressBar({ parameter }: ProgressBarProps) {
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

  return (
    <WidgetCardWrapper title={parameter.name} icon={parameter.icon} contentClassName="flex flex-col justify-center space-y-4">
      <Progress value={value} className="h-4" />
      <p className="text-right text-muted-foreground">
        {value.toFixed(1)} {parameter.unit}
      </p>
    </WidgetCardWrapper>
  );
}
