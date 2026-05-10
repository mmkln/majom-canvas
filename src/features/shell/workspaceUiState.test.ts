// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  resetUserPreferencesForTests,
  primeUserPreferencesForTests,
} from './services/UserPreferencesService.ts';
import {
  loadInitialWorkspaceView,
  persistWorkspaceSessionView,
  readWorkspaceSessionView,
  resolveAvailableWorkspaceView,
  WORKSPACE_SESSION_ACTIVE_VIEW_STORAGE_KEY,
} from './workspaceUiState.ts';

describe('workspaceUiState workspace view restore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserPreferencesForTests();
  });

  it('restores the tab session view before the profile default view', () => {
    primeUserPreferencesForTests({
      workspace: {
        defaultView: 'canvas',
      },
    });
    persistWorkspaceSessionView('kanban');

    expect(loadInitialWorkspaceView()).toBe('kanban');
  });

  it('falls back to the profile default view when the tab session has no view', () => {
    primeUserPreferencesForTests({
      workspace: {
        defaultView: 'learning-studio',
      },
    });

    expect(loadInitialWorkspaceView()).toBe('learning-studio');
  });

  it('ignores invalid tab session values and falls back to the profile default view', () => {
    primeUserPreferencesForTests({
      workspace: {
        defaultView: 'focus-board',
      },
    });
    sessionStorage.setItem(
      WORKSPACE_SESSION_ACTIVE_VIEW_STORAGE_KEY,
      'bad-view'
    );

    expect(readWorkspaceSessionView()).toBeNull();
    expect(loadInitialWorkspaceView()).toBe('focus-board');
  });

  it('falls back to canvas when the restored view is not available', () => {
    primeUserPreferencesForTests({
      workspace: {
        defaultView: 'kanban',
      },
    });
    persistWorkspaceSessionView('boards');

    expect(loadInitialWorkspaceView({ allowBoards: false })).toBe('canvas');
  });

  it('uses the same availability guard for profile defaults', () => {
    primeUserPreferencesForTests({
      workspace: {
        defaultView: 'learning-studio',
      },
    });

    expect(loadInitialWorkspaceView({ allowLearningStudio: false })).toBe(
      'canvas'
    );
  });

  it('resolves unavailable workspace views to canvas', () => {
    expect(
      resolveAvailableWorkspaceView('kanban', { allowKanban: false })
    ).toBe('canvas');
    expect(
      resolveAvailableWorkspaceView('flows', { allowFlows: false })
    ).toBe('canvas');
    expect(resolveAvailableWorkspaceView('canvas')).toBe('canvas');
  });
});
