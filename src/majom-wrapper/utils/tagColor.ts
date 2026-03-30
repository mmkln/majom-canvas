const TAG_COLOR_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#0f766e',
  '#db2777',
  '#ea580c',
  '#0891b2',
  '#16a34a',
  '#ca8a04',
] as const;

export function getDefaultTagColor(title: string): string {
  const normalized = title.trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0;
  }
  return TAG_COLOR_PALETTE[Math.abs(hash) % TAG_COLOR_PALETTE.length] ?? '#2563eb';
}
