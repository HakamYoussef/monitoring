'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type WidgetCardWrapperProps = {
  title: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function WidgetCardWrapper({
  title,
  description,
  className,
  headerClassName,
  contentClassName,
  children,
}: WidgetCardWrapperProps) {
  return (
    <Card className={cn('group relative flex h-full flex-col', className)}>
      <CardHeader className={cn(headerClassName)}>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription className="truncate">{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn('flex-1', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
