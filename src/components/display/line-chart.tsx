'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type LineChartComponentProps = {
  parameter: Parameter;
};

export function LineChartComponent({ parameter }: LineChartComponentProps) {
  const { data, isLoading } = useParameterData(parameter, []);

  const chartConfig = {
    value: {
      label: `${parameter.name} (${parameter.unit})`,
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <WidgetCardWrapper
      title={parameter.name}
      icon={parameter.icon}
      description={`Live trend for ${parameter.name.toLowerCase()}.`}
      contentClassName="pl-0 pr-4 pb-4"
    >
      {isLoading && data.length === 0 ? (
        <div className="p-6 h-full w-full flex items-center justify-center">
            <Skeleton className="h-full w-full" />
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={() => ''} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value) => `${Number(value).toFixed(1)} ${parameter.unit || ''}`}
              />
            }
          />
          <defs>
            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area dataKey="value" type="natural" fill="url(#fillValue)" stroke="var(--color-value)" stackId="a" />
        </AreaChart>
      </ChartContainer>
      )}
    </WidgetCardWrapper>
  );
}
