import type { Board } from '../../../majom-wrapper/interfaces/index.ts';

export const BOARDS_SESSION_SELECTED_BOARD_STORAGE_KEY =
  'boards-session-selected-board';

function normalizeBoardId(value: unknown): Board['id'] | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function isAvailableBoardId(
  boards: readonly Board[],
  boardId: Board['id'] | null
): boardId is Board['id'] {
  return boardId !== null && boards.some((board) => board.id === boardId);
}

export function readBoardsSessionSelectedBoardId(): Board['id'] | null {
  try {
    return normalizeBoardId(
      sessionStorage.getItem(BOARDS_SESSION_SELECTED_BOARD_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

export function persistBoardsSessionSelectedBoardId(
  boardId: Board['id'] | null
): void {
  try {
    const normalizedBoardId = normalizeBoardId(boardId);
    if (normalizedBoardId) {
      sessionStorage.setItem(
        BOARDS_SESSION_SELECTED_BOARD_STORAGE_KEY,
        normalizedBoardId
      );
      return;
    }
    sessionStorage.removeItem(BOARDS_SESSION_SELECTED_BOARD_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function resolveSelectedBoardId(
  boards: readonly Board[],
  preferredBoardId: Board['id'] | null
): Board['id'] | null {
  if (isAvailableBoardId(boards, preferredBoardId)) {
    return preferredBoardId;
  }
  const sessionBoardId = readBoardsSessionSelectedBoardId();
  if (isAvailableBoardId(boards, sessionBoardId)) {
    return sessionBoardId;
  }
  return boards[0]?.id ?? null;
}
