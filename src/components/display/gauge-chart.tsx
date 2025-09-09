'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type RadialGaugeProps = {
  parameter: Parameter;
};

export function RadialGauge({ parameter }: RadialGaugeProps) {
    const { data: value, isLoading } = useParameterData(parameter, 50);

    if (isLoading) {
    return (
        <WidgetCardWrapper
        title={parameter.name}
        icon={parameter.icon}
        description={parameter.description}
        contentClassName="flex items-center justify-center p-4"
        >
        <Skeleton className="aspect-square h-full w-full rounded-full" />
        </WidgetCardWrapper>
    );
    }


  const percentage = value / 100;
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = percentage * (0.75 * circumference);
  const transform = `rotate(135 ${size / 2} ${size / 2})`;

  const getColorClass = (val: number) => {
    if (val < 40) return 'text-green-500';
    if (val < 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <WidgetCardWrapper
      title={parameter.name}
      icon={parameter.icon}
      description={parameter.description}
      headerClassName="items-center pb-2"
      contentClassName="flex items-center justify-center p-4"
    >
      <ChartContainer
        config={{
          value: { label: parameter.name },
        }}
        className="mx-auto aspect-square h-full w-full max-w-[200px]"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
            strokeDasharray={`${0.75 * circumference} ${circumference}`}
            transform={transform}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={cn('stroke-current transition-colors duration-500', getColorClass(value))}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={transform}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-bold"
            style={{ fontSize: '2rem' }}
          >
            {value.toFixed(1)}
          </text>
          <text
            x="50%"
            y="62%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: '1rem' }}
          >
            {parameter.unit}
          </text>
        </svg>
      </ChartContainer>
    </WidgetCardWrapper>
  );
}
