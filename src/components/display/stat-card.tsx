'use client';

import { Parameter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

type StatCardProps = {
  parameter: Parameter;
};

export function StatCard({ parameter }: StatCardProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{parameter.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">
          {value.toFixed(1)}
          <span className="text-2xl text-muted-foreground ml-1">{parameter.unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}
