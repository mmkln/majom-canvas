import type {
  BoardColumn,
  Card,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import { getCardPlacementId } from './cardIdentity.ts';
import type { BoardCardPlacementPatch } from './types.ts';

export type CardPlacementTargetInput = {
  columnId: BoardColumn['id'];
  cards: Card[];
  movingPlacementId: CardPlacement['id'];
  insertionIndex: number;
};

export function resolveCardPlacementTarget({
  columnId,
  cards,
  movingPlacementId,
  insertionIndex,
}: CardPlacementTargetInput): BoardCardPlacementPatch {
  const stableCards = cards.filter(
    (card) => getCardPlacementId(card) !== movingPlacementId
  );
  const boundedIndex = Math.max(0, Math.min(insertionIndex, stableCards.length));
  const previous = boundedIndex > 0 ? stableCards[boundedIndex - 1] : null;
  const next =
    boundedIndex < stableCards.length ? stableCards[boundedIndex] : null;

  const target: BoardCardPlacementPatch = { column: columnId };
  if (previous) target.before_placement = getCardPlacementId(previous);
  if (next) target.after_placement = getCardPlacementId(next);
  if (!previous && !next) target.position = 'bottom';
  return target;
}

export function hasCardPlacementTargetChanged(
  cards: Card[],
  movingPlacementId: CardPlacement['id'],
  target: BoardCardPlacementPatch
): boolean {
  const stableCards = cards.filter(
    (card) => getCardPlacementId(card) !== movingPlacementId
  );
  const currentIndex = cards.findIndex(
    (card) => getCardPlacementId(card) === movingPlacementId
  );
  if (currentIndex < 0) return true;

  const previous = currentIndex > 0 ? cards[currentIndex - 1] : null;
  const next = currentIndex < cards.length - 1 ? cards[currentIndex + 1] : null;
  const previousId = previous ? getCardPlacementId(previous) : null;
  const nextId = next ? getCardPlacementId(next) : null;

  const targetPreviousId = target.before_placement ?? null;
  const targetNextId = target.after_placement ?? null;
  if (stableCards.length === 0) return false;
  return previousId !== targetPreviousId || nextId !== targetNextId;
}
