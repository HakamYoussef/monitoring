'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ReactNode } from 'react';

type WidgetModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: ReactNode;
};

export function WidgetModal({ isOpen, onOpenChange, children }: WidgetModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-8">
        {children}
      </DialogContent>
    </Dialog>
  );
}
