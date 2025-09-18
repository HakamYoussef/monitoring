import { EventEmitter } from 'events';

type ParameterUpdatePayload = {
  dashboard: string;
  parameterId: string;
  data: unknown;
};

type ParameterListener = (payload: ParameterUpdatePayload) => void;

type GlobalRealtimeStore = typeof globalThis & {
  __parameterEmitter?: EventEmitter;
};

const globalStore = globalThis as GlobalRealtimeStore;

const emitter =
  globalStore.__parameterEmitter ?? (globalStore.__parameterEmitter = new EventEmitter());

// Allow any number of listeners – dashboards can have many widgets subscribed.
emitter.setMaxListeners(0);

function getParameterKey(dashboard: string, parameterId: string): string {
  return `${dashboard}::${parameterId}`;
}

export function emitParameterUpdate(payload: ParameterUpdatePayload): void {
  emitter.emit(getParameterKey(payload.dashboard, payload.parameterId), payload);
}

export function subscribeToParameter(
  dashboard: string,
  parameterId: string,
  listener: ParameterListener,
): () => void {
  const key = getParameterKey(dashboard, parameterId);
  emitter.on(key, listener);
  return () => {
    emitter.off(key, listener);
  };
}
