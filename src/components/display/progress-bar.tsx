'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { Progress } from '@/components/ui/progress';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type ProgressBarProps = {
  dashboardName: string;
  parameter: Parameter;
};

export function ProgressBar({ dashboardName, parameter }: ProgressBarProps) {
  const { data, isLoading } = useParameterData<number>(dashboardName, parameter, 50);
  const value = data ?? 0;

  return (
    <WidgetCardWrapper title={parameter.name} icon={parameter.icon} contentClassName="flex flex-col justify-center space-y-4">
      {isLoading ? <Skeleton className="h-4 w-full" /> : <Progress value={value} className="h-4" />}
      <p className="text-right text-muted-foreground">
        {isLoading ? '... ' : `${value.toFixed(1)} `}{parameter.unit}
      </p>
    </WidgetCardWrapper>
  );
}
