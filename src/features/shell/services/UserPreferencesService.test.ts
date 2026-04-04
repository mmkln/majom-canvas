// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import type { User } from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { ACCESS_TOKEN_KEY } from '../../../config/storage-keys.ts';
import { buildUserScopedStorageKey } from '../../canvas-core/core/services/UserScopedStorage.ts';
import {
  LEGACY_AI_ASSISTANT_OPEN_STORAGE_KEY,
  LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY,
  LEGACY_CANVAS_VIEW_STORAGE_KEY,
  LEGACY_LAST_OPENED_CANVAS_STORAGE_KEY,
  LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY,
  LEGACY_TIME_CLUSTERING_OPEN_STORAGE_KEY,
  LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY,
  LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY,
  getAiAssistantOpenPreference,
  getCanvasAutosaveEnabled,
  getCanvasViewStatePreference,
  getCanvasMiniMapVisible,
  getLastOpenedCanvasIdPreference,
  getTimeClusteringOpenPreference,
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

function createJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
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
    localStorage.setItem(LEGACY_AI_ASSISTANT_OPEN_STORAGE_KEY, '1');
    localStorage.setItem(LEGACY_TIME_CLUSTERING_OPEN_STORAGE_KEY, '1');
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      createJwt({ user_id: 'user-1', exp: 4_102_444_800 })
    );
    localStorage.setItem(
      buildUserScopedStorageKey(LEGACY_LAST_OPENED_CANVAS_STORAGE_KEY),
      JSON.stringify({
        data: 'canvas-42',
        updatedAt: 100,
        expiresAt: null,
      })
    );
    localStorage.setItem(
      buildUserScopedStorageKey(`${LEGACY_CANVAS_VIEW_STORAGE_KEY}:canvas-42`),
      JSON.stringify({
        data: {
          scrollX: 320,
          scrollY: 180,
          scale: 1.5,
        },
        updatedAt: 120,
        expiresAt: null,
      })
    );
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
      userApiService: {
        getUser: vi.fn(() => of(createUser())),
        updateUserProfile,
      },
    });

    expect(updateUserProfile).toHaveBeenCalledWith({
      meta: {
        custom: {
          keep: true,
        },
        preferencesVersion: 1,
        workspace: {
          defaultView: 'kanban',
          aiAssistantOpen: true,
          timeClusteringOpen: true,
        },
        timeClustering: {
          layoutMode: 'fullscreen',
        },
        canvasPreferences: {
          miniMapVisible: false,
          autosaveEnabled: false,
        },
        canvasSession: {
          lastOpenedCanvasId: 'canvas-42',
          viewsByCanvasId: {
            'canvas-42': {
              scrollX: 320,
              scrollY: 180,
              scale: 1.5,
            },
          },
        },
      },
    });
    expect(getWorkspaceDefaultView('canvas')).toBe('kanban');
    expect(getAiAssistantOpenPreference(false)).toBe(true);
    expect(getTimeClusteringOpenPreference(false)).toBe(true);
    expect(getTimeClusteringLayoutMode('docked-left')).toBe('fullscreen');
    expect(getCanvasMiniMapVisible(true)).toBe(false);
    expect(getCanvasAutosaveEnabled(true)).toBe(false);
    expect(getLastOpenedCanvasIdPreference()).toBe('canvas-42');
    expect(getCanvasViewStatePreference('canvas-42')).toMatchObject({
      scrollX: 320,
      scrollY: 180,
      scale: 1.5,
    });
    expect(localStorage.getItem(LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY)).toBe(
      null
    );
    expect(
      localStorage.getItem(LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY)
    ).toBe(null);
    expect(localStorage.getItem(LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY)).toBe(
      null
    );
    expect(localStorage.getItem(LEGACY_AI_ASSISTANT_OPEN_STORAGE_KEY)).toBe(
      null
    );
    expect(
      localStorage.getItem(LEGACY_TIME_CLUSTERING_OPEN_STORAGE_KEY)
    ).toBe(null);
    expect(
      localStorage.getItem(LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY)
    ).toBe(null);
    expect(
      localStorage.getItem(
        buildUserScopedStorageKey(LEGACY_LAST_OPENED_CANVAS_STORAGE_KEY)
      )
    ).toBe(null);
    expect(
      localStorage.getItem(
        buildUserScopedStorageKey(`${LEGACY_CANVAS_VIEW_STORAGE_KEY}:canvas-42`)
      )
    ).toBe(null);
  });
});
