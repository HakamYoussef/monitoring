'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

type BarChartComponentProps = {
  parameter: Parameter;
};

const MAX_DATA_POINTS = 10;

export function BarChartComponent({ parameter }: BarChartComponentProps) {
  const [data, setData] = useState(() =>
    Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
      name: `Point ${i + 1}`,
      value: Math.random() * 80 + 10,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setData(
        Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
          name: `Point ${i + 1}`,
          value: Math.random() * 80 + 10,
        }))
      );
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
    <Card>
      <CardHeader>
        <CardTitle>{parameter.name}</CardTitle>
        <CardDescription>
          Bar chart for {parameter.name.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={() => ''}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => `${name}: ${Number(value).toFixed(1)} ${parameter.unit || ''}`}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
