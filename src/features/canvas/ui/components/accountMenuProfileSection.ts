import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { createDivider } from '../primitives/index.ts';

export function createAccountMenuProfileSection(
  user: User | null,
  isUserLoading: boolean
): HTMLElement[] {
  if (isUserLoading) {
    const loadingRow = document.createElement('div');
    loadingRow.className = 'px-4 py-3 text-sm text-slate-500';
    loadingRow.textContent = 'Loading account...';
    return [loadingRow, createDivider()];
  }

  if (!user) {
    return [];
  }

  const userInfo = document.createElement('div');
  userInfo.className = 'px-4 py-3';

  const userName = document.createElement('div');
  userName.className =
    'truncate text-sm font-semibold leading-5 tracking-tight text-slate-900';
  userName.textContent = user.username;

  const userEmail = document.createElement('div');
  userEmail.className = 'truncate text-sm leading-5 text-slate-500';
  userEmail.textContent = user.email;

  userInfo.append(userName, userEmail);
  return [userInfo, createDivider()];
}
