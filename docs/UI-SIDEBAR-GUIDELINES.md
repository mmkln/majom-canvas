# UI Sidebar Guidelines (Workspace Left Rail)

## Purpose

This document defines a concrete style and implementation standard for the workspace left sidebar so it no longer feels like an unstructured prototype.

It supplements (not replaces) the global rules in:
- `docs/UI-STYLE-GUIDELINES.md`
- `docs/UI-ARCHITECTURE.md`

## Scope

Applies to:
- `GlobalAppHeader` when used as a fixed left sidebar container.
- `WorkspaceControlsBar` when `variant: 'sidebar'`.
- Sidebar action cluster (AI assistant, routines, account/menu trigger).

Does not redefine top header or floating controls variants.

---

## Current state (code inventory)

### Sidebar shell (`GlobalAppHeader`)

Current behavior:
- Sidebar is mounted only in development mode and defaults to `72px` width (`GLOBAL_APP_SIDEBAR_WIDTH_PX`).
- Shell is fixed to left, full height, with white background and right border.
- Most shell styling is currently imperative via inline style assignments.
- Bottom utility actions are separated into a menu container with `margin-top: auto`.

### Sidebar controls (`WorkspaceControlsBar`, `variant: 'sidebar'`)

Current behavior:
- Sidebar metrics use local constants (`iconButtonSizePx: 36`, `iconButtonRadiusPx: 12`, `dividerWidthPx: 52`, etc.).
- Layout stacks controls vertically and centers them.
- Hover/active visuals are implemented by directly mutating element styles.
- Buttons are hand-built DOM elements instead of composing HUD button primitives.

### Why it feels "raw"

From UX consistency perspective, the sidebar currently diverges from the project standard by:
1. depending heavily on per-element inline styles,
2. keeping style recipes in feature/controller code rather than a typed style map in shared UI layer,
3. re-implementing interaction states manually instead of reusing HUD primitives and variant APIs,
4. lacking a documented visual contract specifically for sidebar spacing, states, and accessibility details.

---

## Sidebar visual contract (target)

### 1) Geometry and shell

- Sidebar width tokens:
  - `sidebar.compact = 72px` (icon rail)
  - `sidebar.comfort = 80px` (future optional, if larger hit area is needed)
- Height: full viewport.
- Container surface: `surface/base` semantics.
- Border: single right divider only (`border-slate-200/85` equivalent).
- Outer padding: `12px 10px` for compact rail.
- Section gap: `12px`.

### 2) Brand/header zone

- Reserve a top zone with one centered brand affordance.
- Target block spacing:
  - top inset: `4-8px` within shell,
  - spacing below brand block: `16px`.
- Brand block should be visually quiet; avoid extra ornamentation.

### 3) Navigation/action rail items

- Rail button touch target: `36x36` minimum in compact mode.
- Radius: `rounded-lg` equivalent (12px in current scale).
- Icon size: `14-16`.
- Group spacing: `6px` between sibling controls.
- Divider between semantic groups:
  - thickness `1px`,
  - width `52px`,
  - color aligned with neutral divider token.

### 4) State palette

For non-destructive sidebar actions:
- Rest:
  - icon/text: neutral 600,
  - background: transparent.
- Hover:
  - background: neutral 50,
  - icon/text: neutral 900.
- Active/toggled:
  - background: neutral 100,
  - icon/text: neutral 900.
- Focus-visible:
  - must render explicit ring and offset (do not rely on hover-only change).
- Disabled:
  - reduced contrast + blocked pointer semantics.

### 5) Bottom utility cluster

- Utility cluster remains pinned to bottom (`margin-top: auto` behavior is acceptable).
- Vertical order (default): routines -> AI assistant -> app menu.
- Keep same button geometry as primary rail items to avoid mixed affordance shapes.

### 6) Motion

- Use standard subtle timing (`120-160ms`) for hover/active color transitions.
- Avoid movement-heavy transforms in a persistent navigation rail.

---

## Accessibility contract

1. Navigation view group keeps `role="radiogroup"` with buttons using `role="radio"` and valid `aria-checked` state.
2. All icon-only actions require stable `aria-label` and `title`.
3. Keyboard:
   - `Tab` reaches every interactive control in visual order.
   - `Enter/Space` activates controls.
4. Focus-visible must be visually obvious on all rail controls.
5. Tooltips (if used later) must not be the only label source for screen readers.

---

## Implementation architecture rules for sidebar

1. **UI-lib first**
   - Prefer HUD primitives (`createIconButton`, menu/dropdown primitives, surfaces) before custom button DOM creation.
2. **Typed style recipes**
   - Sidebar variants, tones, and states should live in typed variant/style maps, not ad-hoc inline mutation blocks.
3. **No duplicate style dialect**
   - Sidebar visuals should reuse shared neutral surfaces and state tones used by other shell controls.
4. **Lifecycle separation**
   - Keep shell mounting/orchestration in controller class.
   - Move purely visual recipes to UI-lib/hud helpers where reusable.

---

## Recommended incremental refactor plan

### Phase 1 — Documented parity (no UX change)
- Extract sidebar constants into a named sidebar style map/token object.
- Replace repeated inline literal colors/sizes with named entries.
- Preserve current rendering and behavior.

### Phase 2 — Primitive alignment
- Replace hand-built sidebar icon buttons with shared HUD icon button primitive variants.
- Introduce a dedicated HUD variant for `sidebar` if existing variants are insufficient.

### Phase 3 — Accessibility hardening
- Add explicit `focus-visible` styles.
- Ensure disabled state contract exists for every action type.
- Validate keyboard order and `aria` semantics after refactor.

### Phase 4 — Optional comfort mode
- Add optional wider sidebar token (`80px`) behind configuration if product needs larger touch targets.

---

## Definition of done for sidebar style work

A sidebar style task is complete when:
- Geometry, spacing, and state colors match this document.
- Sidebar controls are built from shared primitives or shared style maps (not bespoke scattered inline styles).
- Focus-visible and keyboard navigation are verified.
- No duplicate feature-local style dialect was introduced for common controls.
