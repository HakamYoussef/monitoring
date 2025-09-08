'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

type RadialGaugeProps = {
  parameter: Parameter;
};

export function RadialGauge({ parameter }: RadialGaugeProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const initialValue = 50 + (Math.random() - 0.5) * 40;
    setValue(initialValue);

    const interval = setInterval(() => {
      setValue((prevValue) => {
        const change = (Math.random() - 0.5) * 10;
        let newValue = prevValue + change;
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;
        return newValue;
      });
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  const chartData = [{ name: 'value', value, fill: 'hsl(var(--primary))' }];
  const max = 100;
  const percentage = (value / max) * 100;

  const colorStops = [
    { offset: "0%", color: "hsl(140, 80%, 40%)" },
    { offset: "25%", color: "hsl(140, 80%, 40%)" },
    { offset: "35%", color: "hsl(48, 100%, 50%)" },
    { offset: "75%", color: "hsl(24, 100%, 50%)" },
    { offset: "100%", color: "hsl(0, 100%, 50%)" },
  ];
  
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>{parameter.name}</CardTitle>
        <CardDescription>{parameter.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer
          config={{
            value: {
              label: parameter.name,
              color: 'hsl(var(--foreground))',
            },
          }}
          className="mx-auto aspect-square h-[220px]"
        >
          <svg width="100%" height="100%" viewBox="-10 -15 220 130">
            <defs>
              <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                {colorStops.map((stop, index) => (
                  <stop key={index} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              stroke="hsl(var(--muted))"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              stroke="url(#gaugeGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 282.74} 282.74`}
            />

            <text
              x="100"
              y="85"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-4xl font-bold"
            >
              {value.toFixed(1)}
            </text>
            <text
              x="100"
              y="110"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-lg"
            >
              {parameter.unit}
            </text>
          </svg>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
