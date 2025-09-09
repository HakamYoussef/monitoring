'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  parameter: Parameter;
};

export function StatCard({ parameter }: StatCardProps) {
  const [value, setValue] = useState<number | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);

  useEffect(() => {
    // Set initial value only on the client
    const initialValue = 50 + (Math.random() - 0.5) * 40;
    setValue(initialValue);
    setPreviousValue(initialValue);

    const interval = setInterval(() => {
      setValue((currentValue) => {
        const prev = currentValue ?? initialValue;
        setPreviousValue(prev);
        const change = (Math.random() - 0.5) * 10;
        let newValue = prev + change;
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;
        return newValue;
      });
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  if (value === null || previousValue === null) {
    return (
      <WidgetCardWrapper
        title={parameter.name}
        description={parameter.description}
        contentClassName="flex flex-col items-center justify-center"
      >
        <p className="font-bold text-4xl">--.-</p>
      </WidgetCardWrapper>
    );
  }

  const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral';
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const difference = Math.abs(value - previousValue);

  return (
    <WidgetCardWrapper
      title={parameter.name}
      description={parameter.description}
      contentClassName="flex flex-col items-center justify-center"
    >
      <div className="flex items-baseline">
        <p className="font-bold text-4xl">
          {value.toFixed(1)}
        </p>
        <span
          className="ml-2 text-muted-foreground text-xl"
        >
          {parameter.unit}
        </span>
      </div>
      <div
        className={cn(
          'flex items-center font-medium text-sm',
          trend === 'up' && 'text-green-500',
          trend === 'down' && 'text-red-500',
          trend === 'neutral' && 'text-muted-foreground'
        )}
      >
        <TrendIcon className="mr-1 h-5 w-5" />
        <span>{trend !== 'neutral' ? difference.toFixed(1) : ''}</span>
      </div>
    </WidgetCardWrapper>
  );
}
