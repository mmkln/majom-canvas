import { describe, expect, it } from 'vitest';
import type {
  Board,
  BoardColumn,
} from '../../../majom-wrapper/interfaces/index.ts';
import { BoardSurfaceController } from './BoardSurfaceController.ts';

const board = (id: string, title = 'Board'): Board =>
  ({
    id,
    title,
    columns: [],
  }) as Board;

const column = (id: string, title = 'List'): BoardColumn =>
  ({
    id,
    title,
    cards: [],
  }) as BoardColumn;

describe('BoardSurfaceController', () => {
  it('keeps card composer drafts across same-board state updates', () => {
    const controller = new BoardSurfaceController();
    controller.syncSelectedBoard('board-1');
    controller.beginCardComposer('column-1');
    controller.setCardComposerDraft('column-1', 'Draft card');

    controller.syncSelectedBoard('board-1');

    expect(controller.snapshot.expandedCardComposerColumnId).toBe('column-1');
    expect(controller.getCardComposerDraft('column-1')).toBe('Draft card');
  });

  it('clears surface session state when the selected board changes', () => {
    const controller = new BoardSurfaceController();
    controller.syncSelectedBoard('board-1');
    controller.beginCardComposer('column-1');
    controller.setCardComposerDraft('column-1', 'Draft card');
    controller.beginColumnComposer();
    controller.setColumnComposerDraft('Draft list');

    controller.syncSelectedBoard('board-2');

    expect(controller.snapshot.expandedCardComposerColumnId).toBeNull();
    expect(controller.getCardComposerDraft('column-1')).toBe('');
    expect(controller.snapshot.isColumnComposerExpanded).toBe(false);
    expect(controller.snapshot.columnComposerDraft).toBe('');
  });

  it('reports render transitions for scroll preservation and board switches', () => {
    const controller = new BoardSurfaceController();

    expect(controller.beginRender('board-1')).toEqual({
      selectedBoardChanged: false,
      shouldPreserveScroll: false,
    });
    expect(controller.beginRender('board-1')).toEqual({
      selectedBoardChanged: false,
      shouldPreserveScroll: true,
    });
    expect(controller.beginRender('board-2')).toEqual({
      selectedBoardChanged: true,
      shouldPreserveScroll: false,
    });
  });

  it('returns normalized title edits only when the user applies a change', () => {
    const controller = new BoardSurfaceController();
    const selectedBoard = board('board-1', 'Original board');
    const selectedColumn = column('column-1', 'Original list');

    controller.beginBoardTitleEdit(selectedBoard);
    controller.setBoardTitleDraft('  Renamed board  ');
    expect(controller.finishBoardTitleEdit(selectedBoard, true)).toBe(
      'Renamed board'
    );

    controller.beginColumnTitleEdit(selectedColumn);
    controller.setColumnTitleDraft('Original list');
    expect(controller.finishColumnTitleEdit(selectedColumn, true)).toBeNull();

    controller.beginColumnTitleEdit(selectedColumn);
    controller.setColumnTitleDraft('Ignored list');
    expect(controller.finishColumnTitleEdit(selectedColumn, false)).toBeNull();
  });

  it('keeps quick editor draft across same-board updates', () => {
    const controller = new BoardSurfaceController();
    controller.syncSelectedBoard('board-1');
    controller.openQuickEditor(
      'placement-1',
      { left: 10, top: 20, right: 110, bottom: 80, width: 100, height: 60 },
      'Original title'
    );
    controller.setQuickEditorTitleDraft('placement-1', 'Draft title');

    controller.syncSelectedBoard('board-1');

    expect(controller.snapshot.quickEditor).toMatchObject({
      placementId: 'placement-1',
      titleDraft: 'Draft title',
    });
  });

  it('creates typed drag drop intents and closes quick editor on drag start', () => {
    const controller = new BoardSurfaceController();
    controller.syncSelectedBoard('board-1');
    controller.openQuickEditor(
      'placement-1',
      { left: 10, top: 20, right: 110, bottom: 80, width: 100, height: 60 },
      'Original title'
    );

    controller.beginDrag('card');
    expect(controller.snapshot.quickEditor).toBeNull();

    expect(
      controller.createCardDropIntent('placement-1', {
        column: 'column-2',
        after_placement: 'placement-2',
      })
    ).toEqual({
      placementId: 'placement-1',
      target: {
        column: 'column-2',
        after_placement: 'placement-2',
      },
    });
    expect(
      controller.createColumnDropIntent('column-1', {
        after_column: 'column-2',
      })
    ).toEqual({
      columnId: 'column-1',
      target: {
        after_column: 'column-2',
      },
    });
  });
});
