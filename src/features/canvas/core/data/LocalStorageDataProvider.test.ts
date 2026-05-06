// @vitest-environment jsdom
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import {
  initializeUserPreferences,
  resetUserPreferencesForTests,
  setCanvasViewStatePreference,
} from '../../../shell/services/UserPreferencesService.ts';
import { CanvasClientStorage } from '../services/CanvasClientStorage.ts';
import { LocalStorageDataProvider } from './LocalStorageDataProvider.ts';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
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

async function initializeProfilePreferences(): Promise<void> {
  const user = createUser();
  await initializeUserPreferences({
    user,
    userApiService: {
      getUser: vi.fn(() => of(user)),
      updateUserProfile: vi.fn((payload) =>
        of(
          createUser({
            meta: payload.meta ?? null,
          })
        )
      ),
    },
  });
}

describe('LocalStorageDataProvider canvas view state', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserPreferencesForTests();
  });

  it('loads tab-scoped pan and zoom before the profile canvas view fallback', async () => {
    setCanvasViewStatePreference(
      {
        scrollX: 10,
        scrollY: 20,
        scale: 0.8,
        updatedAt: 100,
      },
      'canvas-1'
    );
    CanvasClientStorage.persistCanvasSessionViewState(
      {
        scrollX: 300,
        scrollY: 400,
        scale: 1.5,
      },
      'canvas-1'
    );

    await expect(
      new LocalStorageDataProvider().loadViewState('canvas-1')
    ).resolves.toEqual({
      scrollX: 300,
      scrollY: 400,
      scale: 1.5,
    });
  });

  it('saves pan and zoom into the tab session for the active canvas', async () => {
    await new LocalStorageDataProvider().saveViewState(
      {
        scrollX: 500,
        scrollY: 600,
        scale: 1.25,
      },
      'canvas-1'
    );

    expect(CanvasClientStorage.readCanvasSessionViewState('canvas-1')).toEqual({
      scrollX: 500,
      scrollY: 600,
      scale: 1.25,
    });
  });

  it('uses the tab active canvas when loading a profile view without an explicit canvas id', async () => {
    await initializeProfilePreferences();
    CanvasClientStorage.persistCanvasSessionActiveCanvasId('canvas-tab');
    setCanvasViewStatePreference(
      {
        scrollX: 700,
        scrollY: 800,
        scale: 1.75,
        updatedAt: 100,
      },
      'canvas-tab'
    );

    await expect(
      new LocalStorageDataProvider().loadViewState()
    ).resolves.toEqual({
      scrollX: 700,
      scrollY: 800,
      scale: 1.75,
    });
  });
});
