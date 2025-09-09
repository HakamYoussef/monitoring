'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Cpu,
  Thermometer,
  MemoryStick,
  HardDrive,
  Network,
  Battery,
  Power,
  Info,
  BarChart,
  LineChart,
  Gauge,
  Type,
  Lightbulb,
  LucideProps,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Sunrise,
  Mountain,
  Compass,
  Umbrella,
} from 'lucide-react';
import { FC, ReactNode } from 'react';

// Map of icon names to Lucide components
const iconMap: { [key: string]: FC<LucideProps> } = {
  Cpu,
  Thermometer,
  MemoryStick,
  HardDrive,
  Network,
  Battery,
  Power,
  Info,
  BarChart,
  LineChart,
  Gauge,
  Type,
  Lightbulb,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Sunrise,
  Mountain,
  Compass,
  Umbrella,
};

type WidgetCardWrapperProps = {
  title: string;
  icon?: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function WidgetCardWrapper({
  title,
  icon,
  description,
  className,
  headerClassName,
  contentClassName,
  children,
}: WidgetCardWrapperProps) {
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <Card className={cn('group relative flex h-full flex-col', className)}>
      <CardHeader className={cn('pb-2', headerClassName)}>
        <CardTitle className="text-lg flex items-center gap-2">
          {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
          {title}
        </CardTitle>
        {description && <CardDescription className="truncate pt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn('flex-1 flex flex-col justify-center', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
