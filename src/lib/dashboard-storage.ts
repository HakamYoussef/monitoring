import type { Parameter } from '@/lib/types';

function normalizeSegment(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'dashboard';
  }
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
    .slice(0, 120);
}

export function getParameterCollectionName(dashboard: string): string {
  return `${normalizeSegment(dashboard)}_parametre`;
}

export function getControlCollectionName(dashboard: string): string {
  return `${normalizeSegment(dashboard)}_control`;
}

export function getParameterFieldCandidates(
  parameter: Pick<Parameter, 'id'> & { name?: Parameter['name'] },
): string[] {
  const candidates = new Set<string>();

  const pushVariants = (value: string | undefined) => {
    if (!value) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const normalizedWhitespace = trimmed.replace(/\s+/g, ' ');
    const variants = [
      normalizedWhitespace,
      normalizedWhitespace.replace(/\s+/g, '_'),
      normalizedWhitespace.replace(/\s+/g, ''),
    ];

    for (const variant of variants) {
      if (!variant) {
        continue;
      }
      candidates.add(variant);
      candidates.add(variant.toLowerCase());
    }
  };

  pushVariants(parameter.id);
  pushVariants(parameter.name);

  return Array.from(candidates);
}
