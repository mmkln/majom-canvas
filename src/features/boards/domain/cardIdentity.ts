import type { Card } from '../../../majom-wrapper/interfaces/index.ts';

export function getCardPlacementId(card: Card): string {
  return card.placement_id ?? card.id;
}

function getCardPlacementRank(card: Card): number {
  const rank = card.pos ?? card.order ?? 0;
  const numericRank = Number(rank);
  return Number.isFinite(numericRank) ? numericRank : 0;
}

export function compareCardsByPlacementPos(left: Card, right: Card): number {
  return (
    getCardPlacementRank(left) - getCardPlacementRank(right) ||
    getCardPlacementId(left).localeCompare(getCardPlacementId(right)) ||
    left.id.localeCompare(right.id)
  );
}
