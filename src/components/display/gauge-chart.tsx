'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

type GaugeChartProps = {
  parameter: Parameter;
};

export function GaugeChart({ parameter }: GaugeChartProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(50);
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

  const chartData = [
    { name: 'value', value: value, fill: 'var(--color-value)' },
  ];

  const chartConfig = {
    value: {
      label: parameter.name,
      color: 'hsl(var(--foreground))',
    },
    green: { color: 'hsl(140, 80%, 40%)' },
    yellow: { color: 'hsl(48, 100%, 50%)' },
    orange: { color: 'hsl(24, 100%, 50%)' },
    red: { color: 'hsl(0, 100%, 50%)' },
  };

  return (
    <Card>
      <CardHeader className="items-center pb-2">
        <CardTitle>{parameter.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[200px]"
        >
          <RadarChart
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            startAngle={180}
            endAngle={0}
          >
            <PolarGrid
              gridType="polygon"
              radialLines={false}
              polarRadius={[0, 25, 50, 75, 100].map(
                (r) => (r * 80) / 100
              )}
              className="fill-muted"
            />
            <PolarAngleAxis dataKey="name" tick={false} />

            <Radar
              dataKey="value"
              stroke="var(--color-value)"
              fill="var(--color-value)"
              fillOpacity={0.6}
            />

            <g transform="translate(100, 100)">
              <circle r="72" fill="hsl(140, 80%, 40%)" clipPath="url(#clip-green)" />
              <circle r="72" fill="hsl(48, 100%, 50%)" clipPath="url(#clip-yellow)" />
              <circle r="72" fill="hsl(24, 100%, 50%)" clipPath="url(#clip-orange)" />
              <circle r="72" fill="hsl(0, 100%, 50%)" clipPath="url(#clip-red)" />
              
              <path d="M -70 0 A 70 70 0 0 1 70 0" stroke="hsl(var(--border))" strokeWidth="1" fill="none" />
              
              <circle r="60" fill="hsl(var(--card))" />
              
              <g transform={`rotate(${(value / 100) * 180 - 90})`}>
                <polygon points="0,-5 0,5 -55,0" fill="hsl(var(--foreground))" />
                <circle cx="0" cy="0" r="7" fill="hsl(var(--foreground))" />
              </g>

              <text x="0" y="40" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                {value.toFixed(1)}
              </text>
              <text x="0" y="60" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground">
                {parameter.unit}
              </text>
            </g>

            <defs>
              <clipPath id="clip-green"><path d="M -72 0 A 72 72 0 0 1 -36 -62.35 L -30 -51.96 A 60 60 0 0 0 -60 0 Z" /></clipPath>
              <clipPath id="clip-yellow"><path d="M -36 -62.35 A 72 72 0 0 1 36 -62.35 L 30 -51.96 A 60 60 0 0 0 -30 -51.96 Z" /></clipPath>
              <clipPath id="clip-orange"><path d="M 36 -62.35 A 72 72 0 0 1 72 0 L 60 0 A 60 60 0 0 0 30 -51.96 Z" /></clipPath>
              <clipPath id="clip-red"><path d="M 72 0 A 72 72 0 0 1 36 62.35 L 30 51.96 A 60 60 0 0 0 60 0 Z" /></clipPath>
            </defs>
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
