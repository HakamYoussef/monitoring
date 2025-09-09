'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type StatCardProps = {
  parameter: Parameter;
};

export function StatCard({ parameter }: StatCardProps) {
  const { data, isLoading } = useParameterData(parameter);

  if (isLoading || !data) {
    return (
      <WidgetCardWrapper
        title={parameter.name}
        icon={parameter.icon}
        description={parameter.description}
        contentClassName="flex flex-col items-center justify-center"
      >
        <div className="h-full flex flex-col items-center justify-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-5 w-16" />
        </div>
      </WidgetCardWrapper>
    );
  }

  const { value, previousValue } = data;
  const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral';
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const difference = Math.abs(value - previousValue);

  return (
    <WidgetCardWrapper
      title={parameter.name}
      icon={parameter.icon}
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
