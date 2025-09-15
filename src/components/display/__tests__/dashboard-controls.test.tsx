import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import type { Control, Parameter } from '@/lib/types';
import { DashboardControls } from '../dashboard-controls';
import { afterEach, describe, expect, it, vi } from 'vitest';

const toastSpy = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/hooks/use-parameter-data', () => ({
  useParameterData: () => ({ data: 55, isLoading: false, error: null }),
}));

afterEach(() => {
  toastSpy.mockClear();
  document.body.innerHTML = '';
});

describe('ThresholdControl', () => {
  it('triggers a toast when the threshold is exceeded', async () => {
    const control: Control = {
      id: 'control-1',
      type: 'threshold',
      parameterId: 'parameter-1',
      threshold: 50,
      label: 'Temperature Threshold',
    };

    const parameter: Parameter = {
      id: 'parameter-1',
      name: 'Temperature',
      unit: '°C',
      displayType: 'stat',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(<DashboardControls controls={[control]} parameters={[parameter]} />);
      });

      expect(toastSpy).toHaveBeenCalledTimes(1);
      const toastPayload = toastSpy.mock.calls[0][0];
      console.log('Toast message:', toastPayload.description);
      expect(toastPayload).toMatchObject({
        variant: 'destructive',
        title: 'Alert',
        description: 'Temperature reached 55.0 °C',
      });
    } finally {
      await act(async () => {
        root.unmount();
      });
      document.body.removeChild(container);
    }
  });
});
