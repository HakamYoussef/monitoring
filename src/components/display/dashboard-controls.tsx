'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Control } from '@/lib/types';

interface DashboardControlsProps {
  controls: Control[];
}

export function DashboardControls({ controls }: DashboardControlsProps) {
  if (!controls.length) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      {controls.map((control) => {
        switch (control.type) {
          case 'refresh':
            return (
              <Button key={control.id} variant="secondary">
                {control.label || 'Refresh'}
              </Button>
            );
          case 'threshold':
            return (
              <div key={control.id} className="flex items-center gap-2">
                <Label htmlFor={`control-${control.id}`}>{control.label || 'Threshold'}</Label>
                <Input id={`control-${control.id}`} type="number" className="w-24" placeholder="0" />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
