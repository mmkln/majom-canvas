import { describe, expect, it, vi } from 'vitest';
import {
  createBoardsCommandFailure,
  createBoardsCommandSuccess,
} from '../domain/boardsCommandResult.ts';
import type {
  BoardsExportResult,
  BoardsImportPlan,
} from '../exchange/schema.ts';
import {
  ImportExportController,
  type ImportExportPorts,
} from './ImportExportController.ts';

const importPlan: BoardsImportPlan = {
  scope: 'board',
  canApply: true,
  counts: { create: 1, update: 0, skip: 0, conflict: 0 },
  items: [
    {
      action: 'create',
      entity: 'board',
      title: 'Imported board',
      path: 'board',
    },
  ],
  diagnostics: [],
  warnings: [],
  errors: [],
};

const exportResult: BoardsExportResult = {
  format: 'markdown',
  scope: 'board',
  fileName: 'board.md',
  content: '# Board',
};

function createPorts(
  overrides: Partial<ImportExportPorts> = {}
): ImportExportPorts {
  return {
    previewImport: vi.fn(async () => importPlan),
    applyImport: vi.fn(async () =>
      createBoardsCommandSuccess({
        scope: 'board',
        created: {
          columnIds: [],
          cardIds: [],
          checklistIds: [],
          checkItemIds: [],
        },
      })
    ),
    exportData: vi.fn(async () => exportResult),
    ...overrides,
  };
}

describe('ImportExportController', () => {
  it('previews source and moves the import workflow into review mode', async () => {
    const ports = createPorts();
    const controller = new ImportExportController(ports);
    controller.openImport({ scope: 'board' });
    controller.setImportSource(
      ['---', 'title: Imported board', '---'].join('\n')
    );

    const plan = await controller.previewImport();

    expect(plan).toBe(importPlan);
    expect(ports.previewImport).toHaveBeenCalledWith({
      raw: ['---', 'title: Imported board', '---'].join('\n'),
      format: 'markdown',
      scope: 'board',
      target: undefined,
      policies: {
        mode: 'create',
        matchStrategy: 'title',
        missingFieldPolicy: 'keep_existing',
        unknownFieldPolicy: 'warn_and_ignore',
      },
    });
    expect(controller.importSnapshot).toMatchObject({
      mode: 'review',
      operation: 'idle',
      lastPreviewPlan: importPlan,
      hasCompletedPreview: true,
      statusOverride: null,
    });
  });

  it('marks a completed preview stale after source changes', async () => {
    const controller = new ImportExportController(createPorts());
    controller.openImport({ scope: 'board' });
    controller.setImportSource('first');
    await controller.previewImport();

    controller.setImportSource('second');

    expect(controller.importSnapshot).toMatchObject({
      source: 'second',
      lastPreviewRequest: null,
      lastPreviewPlan: null,
      hasCompletedPreview: true,
      statusOverride: null,
    });
  });

  it('keeps import open with a recoverable error when apply fails', async () => {
    const controller = new ImportExportController(
      createPorts({
        applyImport: vi.fn(async () =>
          createBoardsCommandFailure({
            code: 'apply_failed',
            messageKey: 'boards.import.applyFailed',
            recoverable: true,
          })
        ),
      })
    );
    controller.openImport({ scope: 'board' });
    controller.setImportSource('source');
    await controller.previewImport();

    const result = await controller.applyImport();

    expect(result).toBe('failed');
    expect(controller.importSnapshot).toMatchObject({
      mode: 'review',
      operation: 'idle',
      statusOverride: {
        messageKey: 'boards.import.applyFailed',
        tone: 'error',
      },
    });
  });

  it('captures export failures without mutating import state', async () => {
    const controller = new ImportExportController(
      createPorts({ exportData: vi.fn(async () => null) })
    );
    controller.openImport({ scope: 'board' });
    controller.setImportSource('source');

    const result = await controller.exportData({
      scope: 'board',
      format: 'markdown',
      boardId: 'board-1',
    });

    expect(result).toBeNull();
    expect(controller.exportSnapshot).toEqual({
      operation: 'idle',
      result: null,
      error: 'boards.export.failed',
    });
    expect(controller.importSnapshot?.source).toBe('source');
  });
});
