'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

type LineChartComponentProps = {
  parameter: Parameter;
};

const MAX_DATA_POINTS = 20;

const generateInitialData = () => {
  const randomData = Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
    time: i,
    value: Math.random() * 20 + 40,
  }));
  return randomData;
};

export function LineChartComponent({ parameter }: LineChartComponentProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(generateInitialData());

    const interval = setInterval(() => {
      setData((prevData) => {
        if (prevData.length === 0) return generateInitialData();
        
        const lastValue = prevData[prevData.length - 1]?.value || 50;
        const change = (Math.random() - 0.5) * 5;
        let newValue = lastValue + change;
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;

        const newDataPoint = { time: (prevData[prevData.length - 1]?.time || 0) + 1, value: newValue };
        const newDataSet = [...prevData, newDataPoint];

        if (newDataSet.length > MAX_DATA_POINTS) {
          return newDataSet.slice(newDataSet.length - MAX_DATA_POINTS);
        }
        return newDataSet;
      });
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  const chartConfig = {
    value: {
      label: `${parameter.name} (${parameter.unit})`,
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <WidgetCardWrapper
      title={parameter.name}
      description={`Live trend for ${parameter.name.toLowerCase()}.`}
      contentClassName="pl-0 pr-4 pb-4"
    >
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
    </WidgetCardWrapper>
  );
}
