'use client';

import { useEffect, useState } from 'react';

export function LocationTime() {
  const [time, setTime] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    // Set time zone once on the client
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' '));

    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Set initial time
    setTime(new Date().toLocaleTimeString());

    return () => clearInterval(interval);
  }, []);

  if (!time || !timeZone) {
    return <div className="h-6 w-48 rounded-md bg-muted animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{time}</span>
      <span className="font-semibold text-foreground">{timeZone}</span>
    </div>
  );
}
