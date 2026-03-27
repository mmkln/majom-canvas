# UI Themes And UI Modes Strategy

## Status

- State: proposal
- Updated: 2026-03-27
- Owner modules: `src/app-runtime`, `src/ui-lib`, `src/features/shell`, `src/bootstrap`, `src/majom-wrapper/data-access`

## Purpose

Define a concrete implementation strategy for two distinct personalization concerns:

1. **UI Theme (skin)** — visual style system (colors, radii, elevation, borders).
2. **UI Mode (presentation profile)** — density/focus behavior (spacing, control size, visual noise level).

This document prevents mixing these concerns and provides an incremental rollout path.

## Conceptual Split (Authoritative)

## A) UI Theme (skin)

Use `theme` to answer: **"How does the app look?"**

Typical theme-controlled properties:
- color roles (surface, text, interactive, danger, accent)
- border style and contrast
- shadow/elevation language
- corner radius language

Examples: `default-light`, `android-like`, `high-contrast`.

## B) UI Mode (presentation profile)

Use `uiMode` to answer: **"How dense/focused is the app presentation?"**

Typical mode-controlled properties:
- vertical rhythm and spacing
- control heights and paddings
- compactness of navigation/control bars
- optional low-value visual noise suppression

Examples: `comfortable`, `compact`, `focus`.

## Rule

`theme` and `uiMode` are orthogonal and must be stored as separate runtime fields.

---

## Why This Fits Current Architecture

- `AppRuntime` is already the app-level reactive boundary and should own app-global preferences.
- Runtime subscriptions with `emitCurrent` already drive live updates in mounted roots.
- UI architecture policy favors incremental convergence through ui-lib primitives and typed style recipes.

This makes runtime-driven theme/mode updates viable without a full rewrite.

---

## Target Runtime Contract (v1)

```ts
export type AppTheme = 'default-light' | 'android-like' | 'high-contrast';
export type UiMode = 'comfortable' | 'compact' | 'focus';

export type AppRuntimeSnapshot = {
  locale: AppLocale;
  energy: AppEnergyState;
  theme: AppTheme;
  uiMode: UiMode;
};
```

### Runtime API additions

- `getTheme(): AppTheme`
- `setTheme(theme: AppTheme): AppTheme`
- `getUiMode(): UiMode`
- `setUiMode(mode: UiMode): UiMode`

Any setter must trigger snapshot fan-out through the existing runtime subscription path.

---

## Persistence Strategy

## Phase 1 (frontend-first)

- Persist `theme` and `uiMode` in localStorage to support immediate UX.
- Use dedicated storage keys near existing shell UI persisted keys.

## Phase 2 (profile-backed)

- Extend user profile contract to include `theme` and `ui_mode` fields.
- Boot flow should initialize runtime from user profile data.
- Save flow should be optimistic with rollback on API error (same pattern as locale persistence).

## Fallback precedence (recommended)

1. Server profile values (when authenticated and available)
2. Local persisted values
3. Product defaults (`default-light`, `comfortable`)

---

## Styling Architecture For Global Theme Swap

## Token Layers

Use three layers to avoid hardcoded visual values:

1. **Semantic tokens** (source of truth)
   - `--color-surface-1`, `--color-text-primary`, `--color-border-soft`, etc.
2. **Component recipe maps**
   - ui-lib/HUD class maps reference semantic tokens instead of raw slate/indigo literals.
3. **Feature-level composition**
   - Feature components compose primitives and avoid redefining base visual language.

## Theme application mechanism

- Set `data-theme="..."` on root (`<html>` or shell root).
- Define token overrides per theme via CSS variable scopes.
- Avoid runtime stylesheet injection for v1; prefer static CSS/token maps for predictability.

## UI mode application mechanism

- Set `data-ui-mode="..."` on root.
- Mode adjusts density tokens and selected component metrics (heights, paddings, spacing).
- Do not let `uiMode` alter brand color system; keep that in `theme`.

---

## Scope Boundaries

## In scope for v1

- shell controls bar metrics
- app menu + dropdown spacing
- core ui-lib controls (`Button`, `Input`, `Textarea`, `Select`, HUD button/input primitives)
- surface treatment and divider contrast through semantic tokens

## Out of scope for v1

- full feature-by-feature redesign of every legacy inline style
- per-module independent theming engines
- user-imported arbitrary theme scripts

---

## Implementation Plan

## Step 1 — Runtime and storage

1. Extend runtime snapshot with `theme` and `uiMode`.
2. Add setters/getters with change guards.
3. Add local persistence helpers and defaults.

## Step 2 — Root application

1. In app shell/bootstrap host, sync runtime snapshot to root dataset attributes.
2. Ensure mounted roots react without page reload.

## Step 3 — ui-lib tokenization

1. Replace raw color literals in shared HUD/class recipes with semantic token classes/vars.
2. Introduce compact/focus density variants where already supported by component options.

## Step 4 — settings UX

1. Add separate controls:
   - Theme selector
   - UI mode selector
2. Reuse optimistic-save + rollback pattern.

## Step 5 — backend persistence

1. Add profile fields and API patch methods.
2. Apply profile values during authenticated bootstrap.

---

## Testing Strategy

Focus on behavior, not visual snapshots.

Required regression tests:
1. Runtime emits updates when `theme`/`uiMode` change.
2. Mounted root updates dataset attributes live.
3. Failed persistence rolls back runtime state.
4. Boot sequence applies server profile theme/mode.

Avoid tests that only assert class string formatting with no user-facing behavior.

---

## Risk Register

1. **Mixed hardcoded styles**
   - Risk: partial theme swap with inconsistent visuals.
   - Mitigation: prioritize ui-lib and high-traffic shell surfaces first.

2. **Overlapping semantics between theme and mode**
   - Risk: non-deterministic UX and combinatorial bugs.
   - Mitigation: strict ownership rule (`theme` for visual language, `uiMode` for density/presentation).

3. **Excessive option complexity in settings**
   - Risk: user confusion.
   - Mitigation: keep defaults explicit and provide short mode/theme descriptions.

---

## Product Defaults (recommended)

- `theme`: `default-light`
- `uiMode`: `comfortable`

These defaults should be stable for new users and can later be adapted by market/segment experiments.

---

## Decision Checklist For Future Tasks

When adding any new visual preference, decide first:

1. Does it change **visual language**? → `theme`
2. Does it change **density/focus/presentation**? → `uiMode`
3. Is it app-global and cross-module? → `AppRuntime`
4. Is it reusable styling policy? → semantic token + ui-lib recipe, not feature-local ad-hoc style

If uncertain, default to keeping it out of feature stores and route through app runtime.
