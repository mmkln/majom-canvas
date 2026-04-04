import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthController } from './AuthController.ts';
import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import type { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import type { UserApiService } from '../../../../majom-wrapper/data-access/user-api-service.ts';

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-uuid-1',
  email: 'user@example.com',
  username: 'user',
  language: 'en',
  wallpaper: null,
  wallpaper_id: null,
  meta: null,
  deletion_requested_at: null,
  ...overrides,
});

describe('AuthController', () => {
  it('syncs an updated user without forcing a second profile reload', () => {
    const profile$ = new Subject<User>();
    const authService = {
      isLoggedIn: () => true,
    } as AuthService;
    const userApiService = {
      getUser: () => profile$.asObservable(),
    } as UserApiService;
    const controller = new AuthController(authService, userApiService);

    controller.initialize();
    expect(controller.getState().isUserLoading).toBe(true);

    const updatedUser = createUser({
      username: 'updated-user',
      language: 'ua',
    });
    controller.syncUser(updatedUser);

    expect(controller.getState().isUserLoading).toBe(false);
    expect(controller.getState().user).toEqual(updatedUser);

    profile$.next(createUser({ username: 'stale-server-user' }));

    expect(controller.getState().user).toEqual(updatedUser);
    controller.destroy();
    profile$.complete();
  });
});
