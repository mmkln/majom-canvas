// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { createAppRuntime } from '../../../app-runtime/index.ts';
import type {
  User,
  Wallpaper,
} from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { ProfileSettingsModal } from './ProfileSettingsModal.ts';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    email: 'user@example.com',
    username: 'mila',
    language: 'en',
    wallpaper: null,
    wallpaper_id: '1',
    meta: null,
    deletion_requested_at: null,
    ...overrides,
  };
}

function createWallpaper(id: number, imageFile: string): Wallpaper {
  return {
    id,
    image_file: imageFile,
  };
}

function createWallpaperService(wallpapers: Wallpaper[]) {
  const setDefaultWallpaper = vi.fn();
  return {
    wallpaperList: wallpapers,
    findWallpaperById: vi.fn((wallpaperId: string | number | null | undefined) => {
      const normalized = wallpaperId === null || wallpaperId === undefined
        ? null
        : String(wallpaperId);
      return wallpapers.find((item) => String(item.id) === normalized) ?? null;
    }),
    setDefaultWallpaper,
  };
}

function createUserApiService(
  overrides: Partial<{
    updateUserProfile: ReturnType<typeof vi.fn>;
    setUserProfileLanguage: ReturnType<typeof vi.fn>;
    setUserWallpaper: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
  }> = {}
) {
  return {
    updateUserProfile: vi.fn((payload?: Partial<User>) =>
      of(createUser(payload))
    ),
    setUserProfileLanguage: vi.fn(() => of(createUser())),
    setUserWallpaper: vi.fn(() => of(createUser())),
    changePassword: vi.fn(() =>
      of({ detail: 'Password updated successfully' })
    ),
    deleteUser: vi.fn(() => of(void 0)),
    ...overrides,
  };
}

function flushPromises(): Promise<void> {
  return Promise.resolve();
}

function openAccountSection(): void {
  document
    .querySelector<HTMLButtonElement>(
      'button[data-role="profile-settings-account-toggle"]'
    )
    ?.click();
}

function openSecuritySection(): void {
  document
    .querySelector<HTMLButtonElement>(
      'button[data-role="profile-settings-security-toggle"]'
    )
    ?.click();
}

function setInputValue(selector: string, value: string): void {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function getLanguageSelectTrigger(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    '[data-role="profile-settings-language-control"] button'
  );
}

function openLanguageSelect(): void {
  getLanguageSelectTrigger()?.click();
}

function getLanguageOption(locale: string): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    `[data-dropdown-select-item="${locale}"]`
  );
}

describe('ProfileSettingsModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders spanish as an available app language option', () => {
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService(),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());

    openLanguageSelect();

    const spanishOption = getLanguageOption('es');

    expect(getLanguageOption('es')).not.toBeNull();
    expect(spanishOption?.textContent).toContain('Spanish');

    modal.destroy();
  });

  it('renders rusyn as an available app language option', () => {
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService(),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());

    openLanguageSelect();

    const rusynOption = getLanguageOption('rue');

    expect(getLanguageOption('rue')).not.toBeNull();
    expect(rusynOption?.textContent).toContain('Rusyn');

    modal.destroy();
  });

  it('keeps account editing collapsed until requested and persists full account detail updates', async () => {
    const updatedUser = createUser({
      first_name: 'Mila',
      last_name: 'Stone',
      username: 'mila-updated',
      email: 'updated@example.com',
    });
    const updateUserProfile = vi.fn(() => of(updatedUser));
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService({ updateUserProfile }),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());

    expect(
      document.querySelector('div[data-role="profile-settings-account-panel"]')
    ).toBeNull();

    openAccountSection();

    const saveButton = () =>
      document.querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-account-save"]'
      );

    expect(saveButton()?.disabled).toBe(true);

    setInputValue(
      'input[data-role="profile-settings-account-first-name-input"]',
      'Mila'
    );
    setInputValue(
      'input[data-role="profile-settings-account-last-name-input"]',
      'Stone'
    );
    setInputValue(
      'input[data-role="profile-settings-account-username-input"]',
      'mila-updated'
    );
    setInputValue(
      'input[data-role="profile-settings-account-email-input"]',
      'updated@example.com'
    );
    expect(saveButton()?.disabled).toBe(false);

    saveButton()?.click();
    await flushPromises();

    expect(updateUserProfile).toHaveBeenCalledWith({
      first_name: 'Mila',
      last_name: 'Stone',
      username: 'mila-updated',
      email: 'updated@example.com',
    });
    expect(document.body.textContent).toContain('Account details updated.');
    expect(document.body.textContent).toContain('Mila Stone');
    expect(document.body.textContent).toContain('mila-updated');
    expect(document.body.textContent).toContain('updated@example.com');

    expect(
      document.querySelector('div[data-role="profile-settings-account-panel"]')
    ).toBeNull();

    openAccountSection();

    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-first-name-input"]'
      )?.value
    ).toBe('Mila');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-last-name-input"]'
      )?.value
    ).toBe('Stone');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-username-input"]'
      )?.value
    ).toBe('mila-updated');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-email-input"]'
      )?.value
    ).toBe('updated@example.com');
    expect(saveButton()?.disabled).toBe(true);

    modal.destroy();
  });

  it('maps backend account field errors into the account form', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const updateUserProfile = vi.fn(() =>
      throwError(() => ({
        first_name: ['First name cannot be blank.'],
        last_name: ['Last name cannot be blank.'],
        username: ['A user with that username already exists.'],
        email: ['A user with that email already exists.'],
      }))
    );
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService({ updateUserProfile }),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());
    openAccountSection();

    setInputValue(
      'input[data-role="profile-settings-account-first-name-input"]',
      'Mila'
    );
    setInputValue(
      'input[data-role="profile-settings-account-last-name-input"]',
      'Stone'
    );
    setInputValue(
      'input[data-role="profile-settings-account-username-input"]',
      'taken-name'
    );
    setInputValue(
      'input[data-role="profile-settings-account-email-input"]',
      'taken@example.com'
    );

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-account-save"]'
      )
      ?.click();

    await flushPromises();
    await flushPromises();

    expect(updateUserProfile).toHaveBeenCalledWith({
      first_name: 'Mila',
      last_name: 'Stone',
      username: 'taken-name',
      email: 'taken@example.com',
    });
    expect(document.body.textContent).toContain('First name cannot be blank.');
    expect(document.body.textContent).toContain('Last name cannot be blank.');
    expect(document.body.textContent).toContain(
      'A user with that username already exists.'
    );
    expect(document.body.textContent).toContain(
      'A user with that email already exists.'
    );

    modal.destroy();
  });

  it('disables account save for invalid email and resets all account drafts when editing is cancelled', () => {
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService(),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());
    openAccountSection();

    setInputValue(
      'input[data-role="profile-settings-account-first-name-input"]',
      'Mila'
    );
    setInputValue(
      'input[data-role="profile-settings-account-last-name-input"]',
      'Stone'
    );
    setInputValue(
      'input[data-role="profile-settings-account-username-input"]',
      'draft-username'
    );
    setInputValue(
      'input[data-role="profile-settings-account-email-input"]',
      'invalid-email'
    );

    expect(
      document.querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-account-save"]'
      )?.disabled
    ).toBe(true);
    expect(document.body.textContent).toContain('Enter a valid email address.');

    setInputValue(
      'input[data-role="profile-settings-account-email-input"]',
      'valid@example.com'
    );

    expect(document.body.textContent).not.toContain(
      'Enter a valid email address.'
    );
    expect(
      document.querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-account-save"]'
      )?.disabled
    ).toBe(false);

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-account-cancel"]'
      )
      ?.click();

    expect(
      document.querySelector('div[data-role="profile-settings-account-panel"]')
    ).toBeNull();

    openAccountSection();

    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-first-name-input"]'
      )?.value
    ).toBe('');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-last-name-input"]'
      )?.value
    ).toBe('');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-username-input"]'
      )?.value
    ).toBe('mila');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-account-email-input"]'
      )?.value
    ).toBe('user@example.com');

    modal.destroy();
  });

  it('rolls back locale when language save fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const user = createUser({ language: 'en' });
    const wallpaperService = createWallpaperService([]);
    const userApiService = createUserApiService({
      setUserProfileLanguage: vi.fn(() =>
        throwError(() => new Error('language-failed'))
      ),
      setUserWallpaper: vi.fn(() => of(user)),
    });
    const runtime = createAppRuntime({
      initialLocale: 'en',
      energyService: null,
    });
    const modal = new ProfileSettingsModal({
      runtime,
      userApiService,
      wallpaperService,
    });

    modal.open(user);

    openLanguageSelect();
    getLanguageOption('uk')?.click();
    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-language-save"]'
      )
      ?.click();

    await flushPromises();

    expect(runtime.i18n.getLocale()).toBe('en');
    expect(document.body.textContent).toContain(
      'Could not save language changes.'
    );

    modal.destroy();
  });

  it('restores the previous wallpaper preview when wallpaper save fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wallpapers = [
      createWallpaper(1, '/wallpaper-one.webp'),
      createWallpaper(2, '/wallpaper-two.webp'),
    ];
    const wallpaperService = createWallpaperService(wallpapers);
    const userApiService = createUserApiService({
      setUserWallpaper: vi.fn(() =>
        throwError(() => new Error('wallpaper-failed'))
      ),
    });
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService,
      wallpaperService,
    });

    modal.open(createUser({ wallpaper_id: '1' }));

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-wallpaper-browse"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="wallpaper-picker-option"][data-wallpaper-id="2"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="wallpaper-picker-apply"]'
      )
      ?.click();

    await flushPromises();
    await flushPromises();

    expect(wallpaperService.setDefaultWallpaper).toHaveBeenNthCalledWith(
      1,
      wallpapers[1]
    );
    expect(wallpaperService.setDefaultWallpaper).toHaveBeenNthCalledWith(
      2,
      wallpapers[0]
    );
    expect(document.body.textContent).toContain(
      'Could not save wallpaper changes.'
    );

    modal.destroy();
  });

  it('shows saved feedback after wallpaper changes persist', async () => {
    const wallpapers = [
      createWallpaper(1, '/wallpaper-one.webp'),
      createWallpaper(2, '/wallpaper-two.webp'),
    ];
    const wallpaperService = createWallpaperService(wallpapers);
    const updatedUser = createUser({ wallpaper_id: '2' });
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService({
        setUserWallpaper: vi.fn(() => of(updatedUser)),
      }),
      wallpaperService,
    });

    modal.open(createUser({ wallpaper_id: '1' }));

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-wallpaper-browse"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="wallpaper-picker-option"][data-wallpaper-id="2"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="wallpaper-picker-apply"]'
      )
      ?.click();

    await flushPromises();
    await flushPromises();

    expect(document.body.textContent).toContain('Wallpaper updated.');

    modal.destroy();
  });

  it('keeps password change collapsed until requested and enables save only when valid', () => {
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService(),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());

    expect(
      document.querySelector('div[data-role="profile-settings-security-panel"]')
    ).toBeNull();

    openSecuritySection();

    const saveButton = () =>
      document.querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-security-save"]'
      );

    expect(saveButton()?.disabled).toBe(true);

    setInputValue(
      'input[data-role="profile-settings-old-password-input"]',
      'current-password'
    );
    expect(saveButton()?.disabled).toBe(true);

    setInputValue(
      'input[data-role="profile-settings-new-password-input"]',
      'short'
    );
    expect(saveButton()?.disabled).toBe(true);

    setInputValue(
      'input[data-role="profile-settings-new-password-input"]',
      'next-password'
    );
    expect(saveButton()?.disabled).toBe(true);

    setInputValue(
      'input[data-role="profile-settings-confirm-password-input"]',
      'another-password'
    );
    expect(saveButton()?.disabled).toBe(true);

    setInputValue(
      'input[data-role="profile-settings-confirm-password-input"]',
      'next-password'
    );
    expect(saveButton()?.disabled).toBe(false);

    modal.destroy();
  });

  it('shows local validation errors for password change fields on keyboard submit', async () => {
    const userApiService = createUserApiService();
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService,
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());
    openSecuritySection();

    document
      .querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-old-password-input"]'
      )
      ?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        })
      );

    await flushPromises();

    expect(userApiService.changePassword).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Current password is required.');
    expect(document.body.textContent).toContain('New password is required.');
    expect(document.body.textContent).toContain(
      'Please confirm the new password.'
    );

    modal.destroy();
  });

  it('maps backend password field errors into the security form', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const changePassword = vi.fn(() =>
      throwError(() => ({
        old_password: ['Old password is not correct'],
        new_password: ['New password must be at least 8 characters long'],
      }))
    );
    const userApiService = createUserApiService({ changePassword });
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService,
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());
    openSecuritySection();

    setInputValue(
      'input[data-role="profile-settings-old-password-input"]',
      'wrong-password'
    );
    setInputValue(
      'input[data-role="profile-settings-new-password-input"]',
      'updated-password'
    );
    setInputValue(
      'input[data-role="profile-settings-confirm-password-input"]',
      'updated-password'
    );

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-security-save"]'
      )
      ?.click();

    await flushPromises();
    await flushPromises();

    expect(changePassword).toHaveBeenCalledWith({
      old_password: 'wrong-password',
      new_password: 'updated-password',
      confirm_password: 'updated-password',
    });
    expect(document.body.textContent).toContain('Old password is not correct');
    expect(document.body.textContent).toContain(
      'New password must be at least 8 characters long'
    );

    modal.destroy();
  });

  it('updates password and clears the security draft after success', async () => {
    const changePassword = vi.fn(() =>
      of({ detail: 'Password updated successfully' })
    );
    const userApiService = createUserApiService({ changePassword });
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService,
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());
    openSecuritySection();

    setInputValue(
      'input[data-role="profile-settings-old-password-input"]',
      'current-password'
    );
    setInputValue(
      'input[data-role="profile-settings-new-password-input"]',
      'next-password'
    );
    setInputValue(
      'input[data-role="profile-settings-confirm-password-input"]',
      'next-password'
    );

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-security-save"]'
      )
      ?.click();

    await flushPromises();

    expect(changePassword).toHaveBeenCalledWith({
      old_password: 'current-password',
      new_password: 'next-password',
      confirm_password: 'next-password',
    });
    expect(document.body.textContent).toContain('Password updated.');
    expect(
      document.querySelector('div[data-role="profile-settings-security-panel"]')
    ).toBeNull();

    openSecuritySection();

    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-old-password-input"]'
      )?.value
    ).toBe('');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-new-password-input"]'
      )?.value
    ).toBe('');
    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-confirm-password-input"]'
      )?.value
    ).toBe('');

    modal.destroy();
  });

  it('clears the password draft when the security panel is cancelled', () => {
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService(),
      wallpaperService: createWallpaperService([]),
    });

    modal.open(createUser());
    openSecuritySection();

    setInputValue(
      'input[data-role="profile-settings-old-password-input"]',
      'current-password'
    );

    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-security-cancel"]'
      )
      ?.click();

    expect(
      document.querySelector('div[data-role="profile-settings-security-panel"]')
    ).toBeNull();

    openSecuritySection();

    expect(
      document.querySelector<HTMLInputElement>(
        'input[data-role="profile-settings-old-password-input"]'
      )?.value
    ).toBe('');

    modal.destroy();
  });

  it('deletes the account only after explicit confirmation', async () => {
    const confirmDeleteAccount = vi
      .fn<(options?: { accountLabel?: string }) => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const deleteUser = vi.fn(() => of(void 0));
    const onAccountDeleted = vi.fn();
    const modal = new ProfileSettingsModal({
      runtime: createAppRuntime({ initialLocale: 'en', energyService: null }),
      userApiService: createUserApiService({
        deleteUser,
      }),
      wallpaperService: createWallpaperService([]),
      confirmDeleteAccount,
      onAccountDeleted,
    });

    modal.open(createUser());

    expect(
      document.querySelector('button[data-role="profile-settings-delete-button"]')
    ).toBeNull();
    document
      .querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-danger-toggle"]'
      )
      ?.click();

    const deleteButton = () =>
      document.querySelector<HTMLButtonElement>(
        'button[data-role="profile-settings-delete-button"]'
      );

    deleteButton()?.click();
    await flushPromises();
    expect(confirmDeleteAccount).toHaveBeenCalledTimes(1);
    expect(deleteUser).not.toHaveBeenCalled();

    deleteButton()?.click();
    await flushPromises();
    await flushPromises();

    expect(confirmDeleteAccount).toHaveBeenCalledTimes(2);
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(onAccountDeleted).toHaveBeenCalledTimes(1);

    modal.destroy();
  });
});
