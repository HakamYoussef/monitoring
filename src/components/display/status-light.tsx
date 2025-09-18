'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { cn } from '@/lib/utils';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type StatusLightProps = {
  dashboardName: string;
  parameter: Parameter;
};

export function StatusLight({ dashboardName, parameter }: StatusLightProps) {
  const { data, isLoading } = useParameterData<number>(dashboardName, parameter, 50);
  const value = data ?? 0;

  const getStatus = (val: number) => {
    if (val < 33) return { label: 'OK', color: 'bg-green-500', shadow: 'shadow-[0_0_12px_4px] shadow-green-500/70' };
    if (val < 67) return { label: 'Warning', color: 'bg-yellow-500', shadow: 'shadow-[0_0_12px_4px] shadow-yellow-500/70' };
    return { label: 'Alert', color: 'bg-red-500', shadow: 'shadow-[0_0_12px_4px] shadow-red-500/70' };
  };

  const status = getStatus(value);
  const lightSize = 'h-24 w-24';
  const labelSize = 'text-lg';

  return (
    <WidgetCardWrapper
      title={parameter.name}
      icon={parameter.icon}
      description={parameter.description}
      contentClassName="flex flex-col items-center justify-center space-y-4"
    >
      {isLoading ? (
        <Skeleton className={cn('rounded-full', lightSize)} />
      ) : (
        <div className={cn('relative', lightSize)}>
          <div className={cn('h-full w-full rounded-full', status.color, status.shadow)} />
        </div>
      )}

      <p className={cn('font-semibold', labelSize)}>{isLoading ? <Skeleton className="h-6 w-20" /> : status.label}</p>
      <p className="text-sm text-muted-foreground">
        {isLoading ? '...' : value.toFixed(1)} {parameter.unit}
      </p>
    </WidgetCardWrapper>
  );
}
