'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  parameter: Parameter;
  onEnlarge: () => void;
  isModal?: boolean;
};

export function StatCard({ parameter, onEnlarge, isModal = false }: StatCardProps) {
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
    <WidgetCardWrapper
      title={parameter.name}
      description={parameter.description}
      onEnlarge={onEnlarge}
      isModal={isModal}
      contentClassName="flex flex-col items-center justify-center"
    >
      <div className="flex items-baseline">
        <p className="font-bold" style={{ fontSize: isModal ? '8rem' : '2.25rem' }}>
          {value.toFixed(1)}
        </p>
        <span
          className="ml-2 text-muted-foreground"
          style={{ fontSize: isModal ? '2rem' : '1.25rem' }}
        >
          {parameter.unit}
        </span>
      </div>
      <div
        className={cn(
          'flex items-center font-medium',
          trend === 'up' && 'text-green-500',
          trend === 'down' && 'text-red-500',
          trend === 'neutral' && 'text-muted-foreground',
          isModal ? 'text-2xl' : 'text-sm'
        )}
      >
        <TrendIcon className="mr-1 h-5 w-5" />
        <span>{trend !== 'neutral' ? Math.abs(value - previousValue).toFixed(1) : ''}</span>
      </div>
    </WidgetCardWrapper>
  );
}
