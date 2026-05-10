import type { Flow } from '../../../majom-wrapper/interfaces/index.ts';
import type { FlowColumn } from './types.ts';

const POS_STEP = 1024;

export function compareFlowsForDisplay(left: Flow, right: Flow): number {
  const leftPos = readFlowColumnPos(left);
  const rightPos = readFlowColumnPos(right);
  if (leftPos !== null || rightPos !== null) {
    return (
      (leftPos ?? getFallbackPos(left)) -
        (rightPos ?? getFallbackPos(right)) ||
      left.title.localeCompare(right.title) ||
      left.id - right.id
    );
  }
  return left.title.localeCompare(right.title) || left.id - right.id;
}

export function resolveFlowColumnPosAtInsertion(
  columns: readonly FlowColumn[],
  movingFlowId: Flow['id'],
  insertionIndex: number
): number | null {
  const stableColumns = columns.filter((column) => column.flow.id !== movingFlowId);
  if (stableColumns.length === 0) return null;

  const boundedIndex = Math.max(0, Math.min(insertionIndex, stableColumns.length));
  const previous = boundedIndex > 0 ? stableColumns[boundedIndex - 1] : null;
  const next =
    boundedIndex < stableColumns.length ? stableColumns[boundedIndex] : null;

  const previousPos = previous ? getFlowPos(previous.flow) : null;
  const nextPos = next ? getFlowPos(next.flow) : null;

  if (previousPos !== null && nextPos !== null) {
    return (previousPos + nextPos) / 2;
  }
  if (previousPos !== null) return previousPos + POS_STEP;
  if (nextPos !== null) return nextPos - POS_STEP;
  return boundedIndex * POS_STEP;
}

export function resolveFlowColumnPosPatches(
  columns: readonly FlowColumn[],
  movingFlowId: Flow['id'],
  insertionIndex: number
): Array<{ column: FlowColumn; pos: number }> {
  const moving = columns.find((column) => column.flow.id === movingFlowId);
  if (!moving) return [];
  const stableColumns = columns.filter((column) => column.flow.id !== movingFlowId);
  const boundedIndex = Math.max(0, Math.min(insertionIndex, stableColumns.length));
  const nextColumns = [...stableColumns];
  nextColumns.splice(boundedIndex, 0, moving);

  return nextColumns
    .map((column, index) => ({ column, pos: (index + 1) * POS_STEP }))
    .filter(({ column, pos }) => readFlowColumnPos(column.flow) !== pos);
}

export function hasFlowInsertionChanged(
  columns: readonly FlowColumn[],
  movingFlowId: Flow['id'],
  insertionIndex: number
): boolean {
  const targetNeighbors = getInsertionNeighbors(columns, movingFlowId, insertionIndex);
  const currentIndex = columns.findIndex((column) => column.flow.id === movingFlowId);
  if (currentIndex < 0) return true;
  const previous = currentIndex > 0 ? columns[currentIndex - 1] : null;
  const next = currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;
  return (
    (previous?.flow.id ?? null) !== (targetNeighbors.previous?.flow.id ?? null) ||
    (next?.flow.id ?? null) !== (targetNeighbors.next?.flow.id ?? null)
  );
}

function getInsertionNeighbors(
  columns: readonly FlowColumn[],
  movingFlowId: Flow['id'],
  insertionIndex: number
): { previous: FlowColumn | null; next: FlowColumn | null } {
  const stableColumns = columns.filter((column) => column.flow.id !== movingFlowId);
  const boundedIndex = Math.max(0, Math.min(insertionIndex, stableColumns.length));
  return {
    previous: boundedIndex > 0 ? stableColumns[boundedIndex - 1] : null,
    next: boundedIndex < stableColumns.length ? stableColumns[boundedIndex] : null,
  };
}

export function readFlowColumnPos(flow: Pick<Flow, 'meta'>): number | null {
  const meta = readRecord(flow.meta);
  const pos = meta?.pos;
  if (typeof pos === 'number' && Number.isFinite(pos)) return pos;
  if (typeof pos === 'string' && pos.trim()) {
    const parsed = Number(pos);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function writeFlowColumnPos(
  currentMeta: Flow['meta'] | undefined,
  pos: number
): Flow['meta'] {
  return {
    ...(readRecord(currentMeta) ?? {}),
    pos,
  };
}

function getFlowPos(flow: Flow): number | null {
  return readFlowColumnPos(flow) ?? getFallbackPos(flow);
}

function getFallbackPos(flow: Flow): number {
  return flow.id * POS_STEP;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
