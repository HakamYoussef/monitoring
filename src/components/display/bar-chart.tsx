'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type BarChartComponentProps = {
  parameter: Parameter;
  onEnlarge: () => void;
  isModal?: boolean;
};

const MAX_DATA_POINTS = 10;
const generateInitialData = () =>
  Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
    name: `Point ${i + 1}`,
    value: Math.random() * 80 + 10,
  }));

export function BarChartComponent({ parameter, onEnlarge, isModal = false }: BarChartComponentProps) {
  const [data, setData] = useState(generateInitialData);

  useEffect(() => {
    if (isModal) return;
    const generateRandomData = () =>
      Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
        name: `Point ${i + 1}`,
        value: Math.random() * 80 + 10,
      }));

    const interval = setInterval(() => {
      setData(generateRandomData());
    }, 3000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, [isModal]);

  const chartConfig = {
    value: {
      label: `${parameter.name} (${parameter.unit})`,
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <WidgetCardWrapper
      title={parameter.name}
      description={`Bar chart for ${parameter.name.toLowerCase()}.`}
      onEnlarge={onEnlarge}
      isModal={isModal}
      contentClassName="pl-0 pr-4 pb-4"
    >
      <ChartContainer config={chartConfig} className="h-full w-full">
        <RechartsBarChart
          accessibilityLayer
          data={data}
          layout={isModal ? "vertical" : "horizontal"}
          margin={
            isModal 
            ? { top: 20, right: 20, left: 40, bottom: 20 }
            : { top: 5, right: 10, left: 10, bottom: 0 }
          }
        >
          <CartesianGrid vertical={isModal} horizontal={!isModal} />
          {isModal ? (
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
          ) : (
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={() => ''} />
          )}
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
