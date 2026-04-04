export function readCanvasMetaFingerprint(meta: unknown): string | null {
  const normalized = normalizeMetaValue(meta);
  if (normalized === null) {
    return null;
  }
  return JSON.stringify(normalized);
}

export function canvasMetaFingerprintsMatch(
  left: string | null,
  right: string | null
): boolean {
  return left === right;
}

function normalizeMetaValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeMetaValue(entry));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, entry]) => [key, normalizeMetaValue(entry)] as const);
    return Object.fromEntries(entries);
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return String(value);
}
