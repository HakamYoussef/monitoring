const DEFAULT_DASHBOARD_SEGMENT = 'dashboard';

function sanitizeSegment(value: string): string {
  const trimmed = value.trim();
  const replaced = trimmed.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '_');
  const compacted = replaced.replace(/_+/g, '_');
  const stripped = compacted.replace(/^_+|_+$/g, '');
  return stripped || DEFAULT_DASHBOARD_SEGMENT;
}

export function getParameterCollectionName(dashboard: string): string {
  return `${sanitizeSegment(dashboard)}_parametre`;
}

export function getControlCollectionName(dashboard: string): string {
  return `${sanitizeSegment(dashboard)}_Control`;
}

export function getConfigParameterCollectionName(dashboard: string): string {
  return `${sanitizeSegment(dashboard)}-parameter`;
}

export function getConfigControlCollectionName(dashboard: string): string {
  return `${sanitizeSegment(dashboard)}-control`;
}
