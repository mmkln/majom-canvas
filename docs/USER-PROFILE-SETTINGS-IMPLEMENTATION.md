# User Profile Settings Implementation Guide

## Status

- State: ready-for-implementation
- Updated: 2026-03-27
- Owner modules: `src/features/shell`, `src/app-runtime`, `src/majom-wrapper/data-access`, `src/ui-lib`

## Purpose

This document is an implementation-ready guide for building a dedicated **User Profile Settings** surface.
It is written for AI-assisted delivery: clear scope, file ownership, data contracts, phased rollout, and acceptance criteria.

## Product Goal

Create one discoverable place where a user can manage profile-related preferences and security actions, instead of splitting them across multiple menus.

## UX IA (Information Architecture)

Implement one surface named **Profile Settings** with these sections:

1. **Account**
   - Username (read-only in MVP)
   - Email (read-only in MVP)
   - Logout action
2. **Language & Region**
   - App language
3. **Workspace Appearance**
   - Wallpaper selection
4. **Security**
   - Change password
   - Session actions (future)
5. **Danger Zone**
   - Request account deletion
   - Restore account info/help link state

## Existing Baseline In Repository

### Existing UI entrypoint

- `WorkspaceAppMenu` already shows account identity, language selection, and logout.
- Use this menu as the initial entrypoint by adding a **Profile settings** menu item.

### Existing API/service capabilities

- `UserApiService.getUser()`
- `UserApiService.setUserProfileLanguage(...)`
- `UserApiService.setUserWallpaper(...)`
- `UserApiService.changePassword(...)`
- `UserApiService.deleteUser()`
- `UserApiService.restoreUser()`

### Existing runtime architecture

- `AppRuntime` is the app-level reactive runtime boundary.
- Locale updates should continue to flow through runtime subscription + API persistence.

### Existing personalization direction

- Product roadmap already defines profile-like personalization inputs:
  - assistant style,
  - planning depth,
  - focus domains,
  - weekly budget.
- These should be added after MVP profile settings are stable.

## Scope And Phasing

## Phase 1 (MVP)

Deliver immediately with existing capabilities:

1. Add **Profile settings** item to app menu.
2. Build `ProfileSettingsModal` in shell feature UI.
3. Account section (read-only username/email + logout).
4. Language section (reuse current locale persistence behavior).
5. Wallpaper section (list + save selected wallpaper).
6. Danger zone section (delete account with explicit confirmation modal).

## Phase 2

Add profile depth requiring backend extension:

1. Security section:
   - change password,
   - session management,
   - optional 2FA placeholders.
2. Personalization section:
   - assistant style,
   - planning depth,
   - weekly time budget,
   - focus domains,
   - personalization reset controls.

## Phase 3

1. Transparency panel for personalization assumptions.
2. Editable inferred tendencies + reset actions.
3. Advanced privacy/export controls when backend supports them.

## File-Level Implementation Plan

## A) App Menu integration

- File: `src/features/shell/components/WorkspaceAppMenu.ts`
- Add one dropdown item:
  - label: `profileSettings.open`
  - action: open `ProfileSettingsModal`
- Keep current locale and logout behavior unchanged.

## B) New modal composite

- File: `src/features/shell/components/ProfileSettingsModal.ts` (new)
- Responsibilities:
  - mount/unmount
  - open/close
  - local draft state
  - section save handlers
- Use existing UI-lib primitives from `src/ui-lib/src/components` and HUD form primitives as needed.

## C) Section-level handlers

- Language save: runtime first, persist via `UserApiService.setUserProfileLanguage(...)`, rollback on failure.
- Wallpaper save: persist via `UserApiService.setUserWallpaper(...)`, sync preview via `WallpaperService`.
- Account deletion: confirmation + call `UserApiService.deleteUser()`.

## D) i18n

- Add translation keys in both locales:
  - `src/i18n/locales/en.ts`
  - `src/i18n/locales/uk.ts`
- Use semantic keys under `profileSettings.*`.

## State Model (Recommended)

In modal controller:

- `serverSnapshot`: last confirmed server state
- `draft`: local editable state
- `dirtyBySection`: booleans
- `savingBySection`: booleans
- `errorBySection`: nullable strings

Save operations should be section-scoped (not one global Save button).

## Behavior Rules

1. Optimistic local UI allowed for language + wallpaper, but rollback on API error.
2. Keep draft data after failed save.
3. Show section-level error message.
4. Use explicit confirmation modal before destructive account actions.
5. Keep mobile text-entry font size >=16px.

## Out Of Scope For MVP

1. Advanced password/session management beyond the available change-password flow.
2. Email/username editing if backend does not support it.
3. Full settings route migration (modal-first approach for MVP).

## Backend Contract Notes

Current security/backend contract status:

1. Change password endpoint is available at `POST /change-password/`.
2. Session list/revoke endpoints (if required).
3. 2FA enrollment/verify endpoints (optional later).

## AI Delivery Checklist

Use this checklist during implementation:

1. Reuse existing UI primitives; do not invent new generic controls unnecessarily.
2. Keep AppRuntime as app-level state boundary.
3. Persist locale through `UserApiService.setUserProfileLanguage(...)`.
4. Add new i18n keys to both `en.ts` and `uk.ts`.
5. Add focused tests only for behavior-critical flows (save/rollback/destructive confirm), not visual markup snapshots.

## Acceptance Criteria (Phase 1)

1. User can open Profile Settings from app menu in <=2 clicks.
2. User sees current username/email.
3. User can change app language and value persists after reload.
4. User can change wallpaper and value persists.
5. Account deletion action requires explicit confirmation.
6. Errors show at section level and do not wipe unsaved draft.
