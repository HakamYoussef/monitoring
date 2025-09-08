'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  parameter: Parameter;
};

export function StatCard({ parameter }: StatCardProps) {
  const [value, setValue] = useState(0);
  const [previousValue, setPreviousValue] = useState(0);

  useEffect(() => {
    const initialValue = 50 + (Math.random() - 0.5) * 40;
    setValue(initialValue);
    setPreviousValue(initialValue);

    const interval = setInterval(() => {
      setPreviousValue(prev => {
        setValue(currentValue => {
          const change = (Math.random() - 0.5) * 10;
          let newValue = currentValue + change;
          if (newValue < 0) newValue = 0;
          if (newValue > 100) newValue = 100;
          return newValue;
        });
        return prev;
      });
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral';
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{parameter.name}</CardTitle>
        <CardDescription>{parameter.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <p className="text-4xl font-bold">
          {value.toFixed(1)}
          <span className="ml-1 text-2xl text-muted-foreground">{parameter.unit}</span>
        </p>
        <div className={cn(
          "flex items-center text-sm font-medium",
          trend === 'up' && 'text-green-500',
          trend === 'down' && 'text-red-500',
          trend === 'neutral' && 'text-muted-foreground'
        )}>
          <TrendIcon className="mr-1 h-4 w-4" />
          <span>{trend !== 'neutral' ? (Math.abs(value-previousValue)).toFixed(1) : ''}</span>
        </div>
      </CardContent>
    </Card>
  );
}
