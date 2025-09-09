'use client';

import { Parameter } from '@/lib/types';
import { WidgetCardWrapper } from './widget-card-wrapper';
import { ChartContainer } from '@/components/ui/chart';
import { useEffect, useState } from 'react';

type RadialGaugeProps = {
  parameter: Parameter;
  onEnlarge: () => void;
  isModal?: boolean;
};

export function RadialGauge({ parameter, onEnlarge, isModal = false }: RadialGaugeProps) {
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

  const percentage = (value / 100) * 100;
  const size = isModal ? 400 : 200;
  const strokeWidth = isModal ? 30 : 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (percentage / 100) * (0.75 * circumference);
  const transform = `rotate(135 ${size / 2} ${size / 2})`;

  const colorStops = [
    { offset: '0%', color: 'hsl(140, 80%, 40%)' },
    { offset: '25%', color: 'hsl(140, 80%, 40%)' },
    { offset: '35%', color: 'hsl(48, 100%, 50%)' },
    { offset: '75%', color: 'hsl(24, 100%, 50%)' },
    { offset: '100%', color: 'hsl(0, 100%, 50%)' },
  ];

  return (
    <WidgetCardWrapper
      title={parameter.name}
      description={parameter.description}
      onEnlarge={onEnlarge}
      isModal={isModal}
      headerClassName="items-center pb-2"
      contentClassName="flex items-center justify-center"
    >
      <ChartContainer
        config={{
          value: { label: parameter.name, color: 'hsl(var(--foreground))' },
        }}
        className="mx-auto aspect-square h-full w-full"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              {colorStops.map((stop, index) => (
                <stop key={index} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
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
            stroke="url(#gaugeGradient)"
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
            style={{ fontSize: isModal ? '4rem' : '2rem' }}
          >
            {value.toFixed(1)}
          </text>
          <text
            x="50%"
            y="65%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: isModal ? '1.5rem' : '1rem' }}
          >
            {parameter.unit}
          </text>
        </svg>
      </ChartContainer>
    </WidgetCardWrapper>
  );
}
