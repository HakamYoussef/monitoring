'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { cn } from '@/lib/utils';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type LinearGaugeProps = {
  dashboardName: string;
  parameter: Parameter;
};

export function LinearGauge({ dashboardName, parameter }: LinearGaugeProps) {
  const { data, isLoading } = useParameterData<number>(dashboardName, parameter, 50);
  const value = data ?? 0;

  const percentage = (value / 100) * 100;

  const getColor = (val: number) => {
    if (val < 25) return 'bg-green-500';
    if (val < 50) return 'bg-yellow-500';
    if (val < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const barHeight = 'h-4';

  return (
    <WidgetCardWrapper
      title={parameter.name}
      icon={parameter.icon}
      description={parameter.description}
      contentClassName="flex flex-col justify-center space-y-4"
    >
      {isLoading ? (
        <Skeleton className={cn('w-full rounded-full', barHeight)} />
      ) : (
        <div className={cn('w-full rounded-full bg-muted', barHeight)}>
          <div
            className={cn('h-full rounded-full transition-all duration-500', getColor(value))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      <p className="text-right text-muted-foreground">
        {isLoading ? '... ' : `${value.toFixed(1)} `}{parameter.unit}
      </p>
    </WidgetCardWrapper>
  );
}
