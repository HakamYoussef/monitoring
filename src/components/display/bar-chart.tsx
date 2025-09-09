'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from 'recharts';

type BarChartComponentProps = {
  parameter: Parameter;
};

const MAX_DATA_POINTS = 10;


export function BarChartComponent({ parameter }: BarChartComponentProps) {
  const [data, setData] = useState<any[]>([]);
  
  const generateRandomData = () =>
  Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
    name: `Point ${i + 1}`,
    value: Math.random() * 80 + 10,
  }));


  useEffect(() => {
    setData(generateRandomData());
    const interval = setInterval(() => {
      setData(generateRandomData());
    }, 3000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

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
      <ChartContainer config={chartConfig} className="h-full w-full">
        <RechartsBarChart
          accessibilityLayer
          data={data}
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
    </WidgetCardWrapper>
  );
}
