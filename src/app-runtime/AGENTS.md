# App Runtime Rules

## Scope

- This file covers app-level reactive runtime state and project translations.
- Use it when a task touches locale, future shell-wide runtime preferences, or live UI updates caused by app-global state.

## Canonical Files

- `src/app-runtime/AppRuntime.ts` is the authoritative container for app-level reactive runtime state.
- `src/i18n/I18nService.ts` owns translation lookup, locale normalization, persistence, and date formatting.
- `src/i18n/locales/en.ts` and `src/i18n/locales/uk.ts` own translation catalogs.
- `src/bootstrap/BootOrchestrator.ts` and `src/bootstrap/RuntimeHost.ts` own top-level runtime creation and module injection.

## Core Rules

- Treat `AppRuntime` as the single app-level reactive boundary for locale and future shell-wide preferences.
- Across bootstrap, module, app, and root-view boundaries, pass `AppRuntime`, not raw `I18nService`, when the boundary represents app-level runtime context.
- Use `runtime.i18n` inside views and controllers that need translation or locale-aware formatting.
- Do not add speculative runtime fields. Extend `AppRuntime` only when there is at least one real consumer.
- Do not put app-global runtime state like locale, theme, timezone, or density into feature domain stores.
- Do not reintroduce bootstrap-level manual refresh fan-out across components. Runtime mutations should propagate through subscriptions.

## Reactive View Pattern

- Any mounted root view that reads app-level runtime state must subscribe in `mount()` and unsubscribe in `unmount()`.
- Prefer `runtime.subscribe(listener, { emitCurrent: true })` so the mounted view gets one initial snapshot without a second manual refresh call.
- Keep the refresh boundary local to the mounted root:
  - store-driven root views should re-render from the current store snapshot
  - simple DOM-driven views should patch labels and ARIA text in place
- For open overlays and modals, prefer in-place label refresh over closing and rebuilding the overlay, unless draft state is irrelevant.

## Translation Rules

- Add or update keys in both `src/i18n/locales/en.ts` and `src/i18n/locales/uk.ts`.
- Use stable semantic keys such as `timeClustering.addCluster` or `header.logout`.
- Do not use English UI text as a key.
- Use `i18n.t(...)` for copy and `i18n.formatDate(...)` for locale-aware dates.
- Do not call `Intl.DateTimeFormat(undefined, ...)` or similar locale-implicit formatting in feature code. Go through `I18nService`.
- If UI copy must stay live across locale changes, store a translation key or resolver and recompute the string on refresh instead of passing a one-time translated string across boundaries.

## Persistence Rules

- Persist user locale changes through `UserApiService.setUserProfileLanguage(...)`.
- Do not bypass the API service when writing user language because it owns backend code mapping and compatibility behavior.
- App locale codes and backend profile language codes are not assumed to be identical; keep transport mapping at the API boundary.

## Testing

- Use `createAppRuntime({ initialLocale: 'en' })` in runtime-aware behavior tests.
- Add focused tests when a mounted view or open overlay must update live after runtime changes.
- Do not add tests for purely presentational translation wiring with no meaningful behavior behind it.

## Smells To Avoid

- Injecting raw `I18nService` through new top-level module boundaries when `AppRuntime` is available.
- Pushing locale into feature stores just to force rerenders.
- Adding a global registry that imperatively calls `refreshTranslations()` across the app.
- Passing pretranslated strings into long-lived surfaces that are expected to react to locale changes.
