// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { Board } from '../../../majom-wrapper/interfaces/index.ts';
import {
  persistBoardsSessionSelectedBoardId,
  readBoardsSessionSelectedBoardId,
  resolveSelectedBoardId,
} from './boardsSessionState.ts';

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const SECOND_BOARD_ID = '00000000-0000-4000-8000-000000000002';

function createBoard(id: Board['id']): Board {
  return {
    id,
    title: id,
    columns: [],
  };
}

describe('boardsSessionState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reads and writes the selected board for the current browser tab', () => {
    persistBoardsSessionSelectedBoardId(BOARD_ID);

    expect(readBoardsSessionSelectedBoardId()).toBe(BOARD_ID);
  });

  it('resolves explicit preferred board before session board', () => {
    persistBoardsSessionSelectedBoardId(SECOND_BOARD_ID);

    expect(
      resolveSelectedBoardId(
        [createBoard(BOARD_ID), createBoard(SECOND_BOARD_ID)],
        BOARD_ID
      )
    ).toBe(BOARD_ID);
  });

  it('falls back to session board before the first available board', () => {
    persistBoardsSessionSelectedBoardId(SECOND_BOARD_ID);

    expect(
      resolveSelectedBoardId(
        [createBoard(BOARD_ID), createBoard(SECOND_BOARD_ID)],
        null
      )
    ).toBe(SECOND_BOARD_ID);
  });

  it('ignores unavailable session board ids', () => {
    persistBoardsSessionSelectedBoardId(SECOND_BOARD_ID);

    expect(resolveSelectedBoardId([createBoard(BOARD_ID)], null)).toBe(
      BOARD_ID
    );
  });
});
