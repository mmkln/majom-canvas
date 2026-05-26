import type { BoardsCommandError, BoardsCommandResult } from './types.ts';

export const BOARDS_SAVE_COMMAND_ERROR: BoardsCommandError = {
  code: 'boards.save_failed',
  messageKey: 'boards.errors.save',
  recoverable: true,
};

export function createBoardsCommandSuccess(): BoardsCommandResult;
export function createBoardsCommandSuccess<T>(data: T): BoardsCommandResult<T>;
export function createBoardsCommandSuccess<T>(
  data?: T
): BoardsCommandResult<T | void> {
  return { ok: true, data };
}

export function createBoardsCommandFailure(
  error: BoardsCommandError = BOARDS_SAVE_COMMAND_ERROR
): BoardsCommandResult<never> {
  return { ok: false, error };
}
