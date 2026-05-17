# UI Architecture Standard

## Purpose

This document defines the default UI implementation approach for Majom during alpha and beyond.
It exists to reduce mixed patterns and keep component behavior, styling, and reuse decisions consistent across modules.

## Core Principles

1. **Evolve, do not rewrite**
   - Prefer incremental standardization over full UI paradigm rewrites.
   - Do not migrate the whole app to HTML templates unless explicitly requested.

2. **UI-lib first**
   - Reuse or extend primitives in `src/ui-lib/src` before adding feature-local primitives.

3. **Behavior and lifecycle are first-class**
   - For stateful interaction patterns (overlay, drag/drop, context menu, picker, modal), keep explicit lifecycle APIs (`mount/unmount`, `open/close`) and cleanup ownership in TypeScript.

4. **Hybrid reactivity by design**
   - The app intentionally uses multiple reactive channels because module responsibilities differ.
   - Do not force canvas runtime, module data stores, and global integration signals into one universal mechanism.

## Responsibility Split

### Tailwind config (`tailwind.config.js`)

Use for reusable design tokens and theme primitives:
- colors
- semantic aliases
- reusable scale values

Do not use Tailwind config as a replacement for component-level variant logic.

### TypeScript UI modules (`src/ui-lib/src/**`, feature UI modules)

Use for:
- variant recipes (`tone`, `size`, `state`)
- stateful class composition
- accessibility attributes and interaction behavior
- component/controller lifecycle management

### Template helpers (optional, local)

Use only for mostly static, low-interaction markup fragments.
Avoid template-heavy patterns for lifecycle-rich or interaction-heavy components.

## Reactive Model (Authoritative)

### Channel A: Module state streams (RxJS stores/subjects)

Use for domain and view-model state transitions.
Example fit: kanban board state pipelines and state-to-view updates.

### Channel B: Canvas runtime streams

Use for high-frequency scene, focus/highlight, viewport, and render-loop triggers.
This channel remains canvas-local and should not be reshaped into generic app store flows.

### Channel C: Global integration events

Use only for cross-module and app-shell integration boundaries.
Keep payload contracts typed and explicit.

### Channel D: Local UI control state

Use imperative control APIs for local visual state (`setValue`, `setDisabled`, loading toggles, ARIA sync) when full re-render is unnecessary.

## Reactive Boundaries: Keep Separate vs Unify

### Keep separate

- Canvas runtime reactivity and draw orchestration.
- Module-level domain stores (for example kanban state stream).
- Notification/toast stream as a cross-cutting UI feedback channel.

### Unify

- Naming and payload contracts across channels (`$` suffix for streams, typed payload guards).
- Cleanup discipline for subscriptions/listeners.
- Policy for choosing granular DOM patching vs full section re-render.

### Reduce/avoid

- Excess use of global `window` custom events for purely internal module UI flows.
- Duplicated event pathways that represent the same state transition in parallel.

## Component Layers

### Layer A: Primitive Components

Small reusable UI building blocks with typed options.

Examples:
- button/input/select/surface primitives
- HUD primitives in `src/ui-lib/src/hud`

### Layer B: Composite Components

Compositions of primitives for a specific feature use-case, while still keeping UI logic mostly local and testable.

### Layer C: UI Controllers

Lifecycle-heavy orchestrators that own subscriptions, DOM mount points, event listeners, and cleanup.

## Styling Rules

1. Keep repeated/long utility class sets in typed style maps (`classNames`, variant maps, tone-size maps).
2. Allow small one-off inline classes for local layout adjustments.
3. Avoid duplicating large utility strings across files.
4. If a repeated value is design-system-level, add it as a Tailwind token first.

## Decision Matrix

- **Need reusable visual primitive?** → `src/ui-lib/src` (prefer HUD-style composition).
- **Need feature-specific UI with light behavior?** → feature composite built from ui-lib primitives.
- **Need lifecycle-heavy interaction flow?** → controller class with explicit cleanup.
- **Need static section markup?** → optional template helper (local and minimal).
- **Need module domain/view state flow?** → RxJS store/subject channel.
- **Need canvas frame/runtime updates?** → canvas-local scene/panzoom/render channels.
- **Need app-shell or cross-module signal?** → typed global integration event.

## Migration Guidance (Alpha)

1. Standardize new code first; avoid broad rewrites of stable code paths.
2. Consolidate duplicated style recipes into ui-lib as features evolve.
3. Move high-value repeated patterns first (buttons, inputs, dropdown surfaces, form messaging).
4. Keep canvas-specific interaction systems feature-local when they depend on canvas scene state.
5. Convert internal module `window` events to module-local typed channels when practical; keep global events only at integration boundaries.
6. Prefer one reactive channel per concern; avoid parallel duplicate channels for the same concern.

## Related Docs

- `AGENTS.md` (global assistant rules and scenario index)
- `docs/CANVAS-UI-TO-UI-LIB-ANALYSIS.md` (canvas-to-ui-lib consolidation analysis)
