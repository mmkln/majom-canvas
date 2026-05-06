import type { Card } from '../../../majom-wrapper/interfaces/index.ts';

export type BoardCardTagSource = Pick<Card, 'tag_ids' | 'tags'>;

export function normalizeBoardCardTagIds(
  tagIds: Iterable<number | null | undefined>
): number[] {
  return [...new Set([...tagIds].filter(isFiniteTagId))].sort(
    (left, right) => left - right
  );
}

export function getBoardCardTagIds(card: BoardCardTagSource): number[] {
  return normalizeBoardCardTagIds(
    card.tag_ids ?? card.tags?.map((tag) => tag.id) ?? []
  );
}

export function haveSameBoardCardTagIds(
  left: Iterable<number | null | undefined>,
  right: Iterable<number | null | undefined>
): boolean {
  const normalizedLeft = normalizeBoardCardTagIds(left);
  const normalizedRight = normalizeBoardCardTagIds(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((id, index) => id === normalizedRight[index])
  );
}

function isFiniteTagId(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
