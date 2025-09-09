'use client';

import { Parameter } from '@/lib/types';
import { RadialGauge } from './gauge-chart';
import { LineChartComponent } from './line-chart';
import { StatCard } from './stat-card';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BarChartComponent } from './bar-chart';
import { ProgressBar } from './progress-bar';
import { LinearGauge } from './linear-gauge';
import { StatusLight } from './status-light';

type WidgetGridProps = {
  parameters: Parameter[];
};

export function WidgetGrid({ parameters }: WidgetGridProps) {
  const renderWidget = (param: Parameter) => {
    const commonProps = {
      parameter: param,
    };

    switch (param.displayType) {
      case 'radial-gauge':
        return <RadialGauge {...commonProps} />;
      case 'line':
        return <LineChartComponent {...commonProps} />;
      case 'stat':
        return <StatCard {...commonProps} />;
      case 'bar':
        return <BarChartComponent {...commonProps} />;
      case 'progress':
        return <ProgressBar {...commonProps} />;
      case 'linear-gauge':
        return <LinearGauge {...commonProps} />;
      case 'status-light':
        return <StatusLight {...commonProps} />;
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
        <div key={param.id} className="h-80">
          {renderWidget(param)}
        </div>
      ))}
    </div>
  );
}
