'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from 'recharts';
import { useParameterData } from '@/hooks/use-parameter-data';
import { Skeleton } from '../ui/skeleton';

type BarChartComponentProps = {
  dashboardName: string;
  parameter: Parameter;
};

export function BarChartComponent({ dashboardName, parameter }: BarChartComponentProps) {
  const { data, isLoading } = useParameterData<Array<{ name: string; value: number }>>(
    dashboardName,
    parameter,
    [],
  );
  const series = data ?? [];

  const chartConfig = {
    value: {
      label: `${parameter.name} (${parameter.unit})`,
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <WidgetCardWrapper
      title={parameter.name}
      icon={parameter.icon}
      description={`Bar chart for ${parameter.name.toLowerCase()}.`}
      contentClassName="pl-0 pr-4 pb-4"
    >
      {isLoading && series.length === 0 ? (
        <div className="p-6 h-full w-full flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RechartsBarChart
            accessibilityLayer
            data={series}
            layout="horizontal"
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={() => ''} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => `${Number(value).toFixed(1)} ${parameter.unit || ''}`}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </RechartsBarChart>
        </ChartContainer>
      )}
    </WidgetCardWrapper>
  );
}
