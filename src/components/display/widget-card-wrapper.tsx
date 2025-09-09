'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Expand } from 'lucide-react';
import { ReactNode } from 'react';

type WidgetCardWrapperProps = {
  title: string;
  description?: string;
  onEnlarge?: () => void;
  isModal?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function WidgetCardWrapper({
  title,
  description,
  onEnlarge,
  isModal = false,
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
      {!isModal && onEnlarge && (
        <button
          onClick={onEnlarge}
          className="absolute top-4 right-4 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-background/50 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-hover:flex"
          aria-label="Enlarge widget"
        >
          <Expand className="h-4 w-4" />
        </button>
      )}
    </Card>
  );
}
