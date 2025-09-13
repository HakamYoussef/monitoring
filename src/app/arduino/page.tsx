'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ArduinoConfigPage() {
  const [apn, setApn] = useState('');
  const [pin, setPin] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [port, setPort] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const connectSerial = async () => {
    try {
      setIsConnecting(true);
      const navigatorSerial = (navigator as any).serial;
      if (!navigatorSerial) {
        throw new Error('Web Serial API not supported in this browser');
      }
      const requestedPort = await navigatorSerial.requestPort();
      await requestedPort.open({ baudRate: 9600 });
      setPort(requestedPort);
      toast({ title: 'Serial Connected', description: 'Arduino connection established.' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: err?.message || 'Failed to connect to serial port.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const sendConfig = async () => {
    if (!port) {
      toast({ variant: 'destructive', title: 'No Connection', description: 'Connect to Arduino first.' });
      return;
    }
    try {
      setIsSending(true);
      const writer = port.writable.getWriter();
      const configString = `${apn},${pin},${serverUrl}\n`;
      await writer.write(new TextEncoder().encode(configString));
      writer.releaseLock();
      toast({ title: 'Configuration Sent', description: 'Settings written to Arduino.' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Send Error',
        description: err?.message || 'Failed to send configuration.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Arduino Configuration</CardTitle>
          <CardDescription>
            Configure SIM and server settings and send them to a connected Arduino device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SIM APN</label>
              <Input value={apn} onChange={(e) => setApn(e.target.value)} placeholder="internet" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SIM PIN</label>
              <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="0000" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Server URL</label>
              <Input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://example.com" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${isConnecting ? 'bg-yellow-500 animate-pulse' : port ? 'bg-green-500' : 'bg-red-500'}`}
              aria-label={port ? 'Arduino connected' : 'Arduino disconnected'}
            />
            <span className="text-sm">
              {isConnecting ? 'Connecting' : port ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex gap-4">
            <Button type="button" onClick={connectSerial} disabled={isConnecting || !!port}>
              {isConnecting ? 'Connecting...' : port ? 'Connected' : 'Connect USB'}
            </Button>
            <Button type="button" onClick={sendConfig} disabled={!port || isSending}>
              {isSending ? 'Sending...' : 'Send to Arduino'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

