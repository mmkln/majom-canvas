// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import type { User } from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY,
  LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY,
  LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY,
  LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY,
  getCanvasAutosaveEnabled,
  getCanvasMiniMapVisible,
  getTimeClusteringLayoutMode,
  getWorkspaceDefaultView,
  initializeUserPreferences,
  resetUserPreferencesForTests,
} from './UserPreferencesService.ts';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    uuid: 'user-1',
    email: 'user@example.com',
    username: 'user',
    language: 'en',
    wallpaper: null,
    wallpaper_id: null,
    meta: null,
    deletion_requested_at: null,
    ...overrides,
  };
}

describe('UserPreferencesService', () => {
  beforeEach(() => {
    localStorage.clear();
    resetUserPreferencesForTests();
  });

  it('migrates targeted legacy preferences into user meta and clears legacy storage', async () => {
    localStorage.setItem(LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY, 'kanban');
    localStorage.setItem(
      LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY,
      'fullscreen'
    );
    localStorage.setItem(LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY, '0');
    localStorage.setItem(LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY, '0');
    const updateUserProfile = vi.fn((payload) =>
      of(
        createUser({
          meta: payload.meta ?? null,
        })
      )
    );

    await initializeUserPreferences({
      user: createUser({
        meta: {
          custom: {
            keep: true,
          },
        },
      }),
      userApiService: { updateUserProfile },
    });

    expect(updateUserProfile).toHaveBeenCalledWith({
      meta: {
        custom: {
          keep: true,
        },
        preferencesVersion: 1,
        workspace: {
          defaultView: 'kanban',
        },
        timeClustering: {
          layoutMode: 'fullscreen',
        },
        canvasPreferences: {
          miniMapVisible: false,
          autosaveEnabled: false,
        },
      },
    });
    expect(getWorkspaceDefaultView('canvas')).toBe('kanban');
    expect(getTimeClusteringLayoutMode('docked-left')).toBe('fullscreen');
    expect(getCanvasMiniMapVisible(true)).toBe(false);
    expect(getCanvasAutosaveEnabled(true)).toBe(false);
    expect(localStorage.getItem(LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY)).toBe(
      null
    );
    expect(
      localStorage.getItem(LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY)
    ).toBe(null);
    expect(localStorage.getItem(LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY)).toBe(
      null
    );
    expect(
      localStorage.getItem(LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY)
    ).toBe(null);
  });
});
