import type { BoardColumn } from '../../../majom-wrapper/interfaces/index.ts';
import type { BoardColumnPatch } from './types.ts';

export type ColumnTargetInput = {
  columns: BoardColumn[];
  movingColumnId: BoardColumn['id'];
  insertionIndex: number;
};

export function resolveColumnTarget({
  columns,
  movingColumnId,
  insertionIndex,
}: ColumnTargetInput): BoardColumnPatch {
  const stableColumns = columns.filter((column) => column.id !== movingColumnId);
  const boundedIndex = Math.max(
    0,
    Math.min(insertionIndex, stableColumns.length)
  );
  const previous = boundedIndex > 0 ? stableColumns[boundedIndex - 1] : null;
  const next =
    boundedIndex < stableColumns.length ? stableColumns[boundedIndex] : null;

  const target: BoardColumnPatch = {};
  if (previous) target.before_column = previous.id;
  if (next) target.after_column = next.id;
  if (!previous && !next) target.position = 'end';
  return target;
}

export function hasColumnTargetChanged(
  columns: BoardColumn[],
  movingColumnId: BoardColumn['id'],
  target: BoardColumnPatch
): boolean {
  const stableColumns = columns.filter((column) => column.id !== movingColumnId);
  const currentIndex = columns.findIndex((column) => column.id === movingColumnId);
  if (currentIndex < 0) return true;
  if (stableColumns.length === 0) return false;

  const previous = currentIndex > 0 ? columns[currentIndex - 1] : null;
  const next =
    currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;
  const previousId = previous?.id ?? null;
  const nextId = next?.id ?? null;

  return (
    previousId !== (target.before_column ?? null) ||
    nextId !== (target.after_column ?? null)
  );
}
