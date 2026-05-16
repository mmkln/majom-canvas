import type {
  Board,
  BoardColumn,
  Card,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  type BoardsImportPlan,
  type BoardsImportPlanItem,
  type BoardsImportRequest,
  type ExchangeBoardPayload,
  type ExchangeCardPayload,
  type ExchangeColumnPayload,
} from './schema.ts';
import { buildInitialImportPlan } from './markdownParser.ts';
import { parseBoardsImport } from './importParser.ts';

function addPlanItem(plan: BoardsImportPlan, item: BoardsImportPlanItem): void {
  plan.items.push(item);
  plan.counts[item.action] += 1;
  if (item.action === 'conflict') plan.canApply = false;
}

function findTitleMatches<T extends { title: string }>(
  title: string,
  entities: T[]
): T[] {
  const normalized = title.trim().toLowerCase();
  return entities.filter(
    (item) => item.title.trim().toLowerCase() === normalized
  );
}

function getPayloadFields(payload: Record<string, unknown>): string[] {
  return Object.entries(payload)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
}

function getAllCards(boards: Board[]): Card[] {
  const cards: Card[] = [];
  for (const board of boards) {
    for (const column of board.columns ?? []) {
      cards.push(...(column.cards ?? []));
    }
  }
  return cards;
}

function getAllColumns(boards: Board[]): BoardColumn[] {
  const columns: BoardColumn[] = [];
  for (const board of boards) {
    columns.push(...(board.columns ?? []));
  }
  return columns;
}

function addCardCreatePlanItems(
  plan: BoardsImportPlan,
  card: ExchangeCardPayload,
  path: string
): void {
  addPlanItem(plan, {
    action: 'create',
    entity: 'card',
    title: card.title,
    path,
    reason: 'card-import',
    source: {
      ...(card.id ? { id: card.id } : {}),
      explicitFields: getPayloadFields(
        card as unknown as Record<string, unknown>
      ),
    },
  });

  for (const [checklistIndex, checklist] of (card.checklists ?? []).entries()) {
    const checklistPath = `${path}.checklists[${checklistIndex}]`;
    addPlanItem(plan, {
      action: 'create',
      entity: 'checklist',
      title: checklist.title,
      path: checklistPath,
      reason: 'checklist-import',
      source: {
        ...(checklist.id ? { id: checklist.id } : {}),
        explicitFields: getPayloadFields(
          checklist as unknown as Record<string, unknown>
        ),
      },
    });

    for (const [itemIndex, item] of (checklist.items ?? []).entries()) {
      addPlanItem(plan, {
        action: 'create',
        entity: 'checkItem',
        title: item.title,
        path: `${checklistPath}.items[${itemIndex}]`,
        reason: 'check-item-import',
        source: {
          ...(item.id ? { id: item.id } : {}),
          explicitFields: getPayloadFields(
            item as unknown as Record<string, unknown>
          ),
        },
      });
    }
  }
}

function findColumn(
  stateBoards: Board[],
  columnId: BoardColumn['id']
): BoardColumn | null {
  for (const board of stateBoards) {
    const match = (board.columns ?? []).find(
      (column) => column.id === columnId
    );
    if (match) return match;
  }
  return null;
}

function resolveExistingByTitle<T extends { id: string; title: string }>(
  title: string,
  candidates: T[],
  entity: BoardsImportPlanItem['entity'],
  path: string,
  plan: BoardsImportPlan
): T | null {
  const matches = findTitleMatches(title, candidates);
  if (matches.length > 1) {
    addPlanItem(plan, {
      action: 'conflict',
      entity,
      title,
      path,
      reason: 'ambiguous-title-match',
    });
    return null;
  }
  return matches[0] ?? null;
}

function resolveRootAction(
  plan: BoardsImportPlan,
  request: BoardsImportRequest,
  existing: { id: string } | null
): BoardsImportPlanItem['action'] | null {
  if (request.policies.mode === 'create') return 'create';
  if (existing) return 'update';
  if (request.policies.mode === 'replace') {
    addPlanItem(plan, {
      action: 'conflict',
      entity: request.scope,
      title: 'Import target',
      path: 'target',
      reason: 'replace-target-not-found',
    });
    return null;
  }
  return 'create';
}

export function previewBoardsImport(
  stateBoards: Board[],
  request: BoardsImportRequest
): BoardsImportPlan {
  const parsed = parseBoardsImport(request);
  const plan = buildInitialImportPlan(request.scope, parsed.diagnostics);
  if (!parsed.envelope || plan.errors.length > 0) {
    addPlanItem(plan, {
      action: 'conflict',
      entity: request.scope,
      title: 'Import source',
      path: 'source',
      reason: 'invalid-source',
    });
    return plan;
  }

  if (request.scope === 'board') {
    const payload = parsed.envelope.payload as ExchangeBoardPayload;
    const existing =
      payload.id !== undefined
        ? (stateBoards.find((board) => board.id === payload.id) ?? null)
        : request.policies.matchStrategy === 'title'
          ? resolveExistingByTitle(
              payload.title,
              stateBoards,
              'board',
              'payload',
              plan
            )
          : null;
    if (plan.counts.conflict > 0) return plan;
    const action = resolveRootAction(plan, request, existing);
    if (!action) return plan;
    addPlanItem(plan, {
      action,
      entity: 'board',
      title: payload.title,
      path: 'payload',
      reason: existing ? 'matched-by-title' : 'new-board',
      ...(existing ? { targetId: existing.id } : {}),
      source: {
        ...(payload.id ? { id: payload.id } : {}),
        explicitFields: getPayloadFields(
          payload as unknown as Record<string, unknown>
        ),
      },
    });
    for (const [columnIndex, column] of (payload.columns ?? []).entries()) {
      addPlanItem(plan, {
        action: 'create',
        entity: 'column',
        title: column.title,
        path: `payload.columns[${columnIndex}]`,
        reason: 'column-import',
        source: {
          ...(column.id ? { id: column.id } : {}),
          explicitFields: getPayloadFields(
            column as unknown as Record<string, unknown>
          ),
        },
      });
      for (const [cardIndex, card] of (column.cards ?? []).entries()) {
        addCardCreatePlanItems(
          plan,
          card,
          `payload.columns[${columnIndex}].cards[${cardIndex}]`
        );
      }
    }
    return plan;
  }

  if (request.scope === 'column') {
    const payload = parsed.envelope.payload as ExchangeColumnPayload;
    if (request.target?.boardId) {
      const boardExists = stateBoards.some(
        (board) => board.id === request.target?.boardId
      );
      if (!boardExists) {
        addPlanItem(plan, {
          action: 'conflict',
          entity: 'board',
          title: request.target.boardId,
          path: 'target.boardId',
          reason: 'target-board-not-found',
        });
        return plan;
      }
    }
    const existing =
      payload.id !== undefined
        ? (getAllColumns(stateBoards).find(
            (column) => column.id === payload.id
          ) ?? null)
        : null;
    const action = resolveRootAction(plan, request, existing);
    if (!action) return plan;
    addPlanItem(plan, {
      action,
      entity: 'column',
      title: payload.title,
      path: 'payload',
      reason: 'column-import',
      ...(existing ? { targetId: existing.id } : {}),
      source: {
        ...(payload.id ? { id: payload.id } : {}),
        explicitFields: getPayloadFields(
          payload as unknown as Record<string, unknown>
        ),
      },
    });
    for (const [cardIndex, card] of (payload.cards ?? []).entries()) {
      addCardCreatePlanItems(plan, card, `payload.cards[${cardIndex}]`);
    }
    return plan;
  }

  const payload = parsed.envelope.payload as ExchangeCardPayload;
  const targetCard =
    request.target?.cardId !== undefined
      ? (getAllCards(stateBoards).find(
          (card) => card.id === request.target?.cardId
        ) ?? null)
      : payload.id !== undefined
        ? (getAllCards(stateBoards).find((card) => card.id === payload.id) ??
          null)
        : request.policies.matchStrategy === 'title'
          ? resolveExistingByTitle(
              payload.title,
              getAllCards(stateBoards),
              'card',
              'payload',
              plan
            )
          : null;
  if (plan.counts.conflict > 0) return plan;

  if (
    request.target?.columnId &&
    !findColumn(stateBoards, request.target.columnId)
  ) {
    addPlanItem(plan, {
      action: 'conflict',
      entity: 'column',
      title: request.target.columnId,
      path: 'target.columnId',
      reason: 'target-column-not-found',
    });
    return plan;
  }

  const action = resolveRootAction(plan, request, targetCard);
  if (!action) return plan;
  addPlanItem(plan, {
    action,
    entity: 'card',
    title: payload.title,
    path: 'payload',
    reason: 'card-import',
    ...(targetCard ? { targetId: targetCard.id } : {}),
    source: {
      ...(payload.id ? { id: payload.id } : {}),
      explicitFields: getPayloadFields(
        payload as unknown as Record<string, unknown>
      ),
    },
  });
  if (action === 'create') {
    for (const [checklistIndex, checklist] of (
      payload.checklists ?? []
    ).entries()) {
      const checklistPath = `payload.checklists[${checklistIndex}]`;
      addPlanItem(plan, {
        action: 'create',
        entity: 'checklist',
        title: checklist.title,
        path: checklistPath,
        reason: 'checklist-import',
        source: {
          ...(checklist.id ? { id: checklist.id } : {}),
          explicitFields: getPayloadFields(
            checklist as unknown as Record<string, unknown>
          ),
        },
      });
      for (const [itemIndex, item] of (checklist.items ?? []).entries()) {
        addPlanItem(plan, {
          action: 'create',
          entity: 'checkItem',
          title: item.title,
          path: `${checklistPath}.items[${itemIndex}]`,
          reason: 'check-item-import',
          source: {
            ...(item.id ? { id: item.id } : {}),
            explicitFields: getPayloadFields(
              item as unknown as Record<string, unknown>
            ),
          },
        });
      }
    }
  }
  return plan;
}
