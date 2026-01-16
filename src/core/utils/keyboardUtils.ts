export function normalizeKeyboardKey(e: KeyboardEvent): string {
  if (e.code?.startsWith('Key')) return e.code.slice(3).toLowerCase();
  if (e.code?.startsWith('Digit')) return e.code.slice(5);
  return e.key.toLowerCase();
}
