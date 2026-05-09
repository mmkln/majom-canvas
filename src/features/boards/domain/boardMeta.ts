import type { Board } from '../../../majom-wrapper/interfaces/index.ts';

export type BoardMetaRecord = Record<string, unknown>;
export type BoardGroup = { id: string; name: string };

const BOARD_META_RECENT_DATE_KEYS = [
  'lastOpenedAt',
  'last_opened_at',
  'lastActivityAt',
  'last_activity_at',
  'updatedAt',
  'updated_at',
  'createdAt',
  'created_at',
] as const;

export function readBoardMeta(board: Board): BoardMetaRecord | null {
  const meta = board.meta;
  return meta && typeof meta === 'object' && !Array.isArray(meta)
    ? meta
    : null;
}

export function cloneBoardMeta(board: Board): BoardMetaRecord {
  return { ...(readBoardMeta(board) ?? {}) };
}

function readBoardMetaBoolean(board: Board, keys: readonly string[]): boolean {
  const meta = readBoardMeta(board);
  if (!meta) return false;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

export function isBoardStarred(board: Board): boolean {
  return readBoardMetaBoolean(board, ['favorite', 'favourite', 'starred']);
}

export function getBoardRecentTimestamp(board: Board): number | null {
  const meta = readBoardMeta(board);
  if (!meta) return null;
  for (const key of BOARD_META_RECENT_DATE_KEYS) {
    const value = meta[key];
    const timestamp =
      typeof value === 'string' || typeof value === 'number'
        ? new Date(value).getTime()
        : null;
    if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
      return timestamp;
    }
  }
  return null;
}

export function getBoardGroup(board: Board): BoardGroup | null {
  const meta = readBoardMeta(board);
  if (!meta) return null;
  const group = meta.group;
  if (group && typeof group === 'object' && !Array.isArray(group)) {
    const candidate = group as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const name =
      typeof candidate.name === 'string' ? candidate.name.trim() : '';
    if (id || name) {
      return {
        id: id || name,
        name: name || id,
      };
    }
  }

  const groupId =
    typeof meta.groupId === 'string'
      ? meta.groupId.trim()
      : typeof meta.group_id === 'string'
        ? meta.group_id.trim()
        : '';
  const groupName =
    typeof meta.groupName === 'string'
      ? meta.groupName.trim()
      : typeof meta.group_name === 'string'
        ? meta.group_name.trim()
        : '';
  if (!groupId && !groupName) return null;
  return {
    id: groupId || groupName,
    name: groupName || groupId,
  };
}

export function setBoardMetaStarred(
  board: Board,
  starred: boolean
): BoardMetaRecord {
  return {
    ...cloneBoardMeta(board),
    favorite: starred,
  };
}

export function setBoardMetaLastOpenedAt(
  board: Board,
  openedAtIso: string
): BoardMetaRecord {
  return {
    ...cloneBoardMeta(board),
    lastOpenedAt: openedAtIso,
  };
}

export function setBoardMetaGroup(
  board: Board,
  group: BoardGroup | null
): BoardMetaRecord {
  const meta = cloneBoardMeta(board);
  if (!group) {
    delete meta.group;
    delete meta.groupId;
    delete meta.groupName;
    delete meta.group_id;
    delete meta.group_name;
    return meta;
  }

  const id = group.id.trim() || group.name.trim();
  const name = group.name.trim() || group.id.trim();
  meta.group = { id, name };
  meta.groupId = id;
  meta.groupName = name;
  meta.group_id = id;
  meta.group_name = name;
  return meta;
}

export function getUniqueBoardGroups(boards: readonly Board[]): BoardGroup[] {
  const groups = new Map<string, BoardGroup>();
  boards.forEach((board) => {
    const group = getBoardGroup(board);
    if (!group || groups.has(group.id)) return;
    groups.set(group.id, group);
  });
  return Array.from(groups.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

export function generateBoardGroupId(
  name: string,
  boards: readonly Board[]
): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = normalized || 'group';
  const taken = new Set(getUniqueBoardGroups(boards).map((group) => group.id));
  if (!taken.has(base)) return base;
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (taken.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}
