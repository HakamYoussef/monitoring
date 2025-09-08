'use client';

import { Parameter } from '@/lib/types';
import { GaugeChart } from './gauge-chart';
import { LineChartComponent } from './line-chart';
import { StatCard } from './stat-card';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';

type WidgetGridProps = {
  parameters: Parameter[];
};

export function WidgetGrid({ parameters }: WidgetGridProps) {
  const renderWidget = (param: Parameter) => {
    switch (param.displayType) {
      case 'gauge':
        return <GaugeChart parameter={param} />;
      case 'line':
        return <LineChartComponent parameter={param} />;
      case 'stat':
        return <StatCard parameter={param} />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{param.name}</CardTitle>
              <CardDescription>Unknown display type: {param.displayType}</CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {parameters.map((param) => (
        <div key={param.id}>{renderWidget(param)}</div>
      ))}
    </div>
  );
}
