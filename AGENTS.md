# AGENTS

## Role Of This File

- Root `AGENTS.md` is the scenario index plus project-wide rules.
- Keep scenario entries short. They should help the assistant recognize the task fast and jump to the right detailed guide.
- Keep detailed instructions close to the owning code, usually in a local `AGENTS.md` or module `README.md`.
- Each scenario entry should state when to use it, which module owns it, and which document to read first.

## Global Rules

### UI First

- This project already has a local UI library under `src/ui-lib/src`.
- Check existing UI primitives before building any new component.
- Prefer reusing or composing existing components from `src/ui-lib/src/components`, `src/ui-lib/src/hud`, and feature-level re-exports such as `src/features/canvas/ui/primitives/index.ts`.
- Do not generate a new button, input, textarea, checkbox, select, modal, dropdown, toggle, notification, or similar UI primitive if an existing one can be reused with small adaptation.
- Prefer extending styling, variants, tones, sizes, and behaviors of existing UI-lib components instead of creating bespoke DOM and inline-styled controls from scratch.
- Only create a new reusable UI component after confirming by search that the existing UI library does not already cover the use case.
- If a new primitive is needed and it is reusable across features, add it to `src/ui-lib/src` instead of duplicating it inside a feature module.

### Existing UI Library Areas

- Base components: `Button`, `Input`, `Textarea`, `Checkbox`, `Select`, `SearchSelect`, `Modal`, `ToastProvider`, `Notification`.
- Factory/services: `ComponentFactory`, modal and notification services.
- HUD primitives: text/icon buttons, dropdowns, anchored menus, fields, form messages, inputs, segmented controls, toggle switches, surfaces, and related helpers.

### Expected Workflow For UI Changes

1. Search `src/ui-lib/src` and existing feature re-exports for a matching primitive.
2. Reuse the existing component directly, or wrap/compose it if the screen needs a thin specialization.
3. Add a new component only if no suitable primitive exists after that search.

### UI Composition Standard

- For any request about UI component structure, styling strategy, or templating, read `docs/UI-ARCHITECTURE.md` first.
- Do not propose or perform a full UI paradigm rewrite (for example, migrating all UI creation to HTML templates) unless the user explicitly asks for a full migration plan.
- Use this split by default:
  - Tailwind config: design tokens and theme primitives.
  - TypeScript UI modules: component variants, state-driven class composition, accessibility attributes, and behavior.
  - HTML template helpers: only for mostly static markup blocks with low interaction complexity.
- For interactive overlays, drag/drop surfaces, context menus, modal flows, and other lifecycle-heavy UI, prefer TypeScript component/controller patterns with explicit mount/unmount or open/close cleanup.

### Dropdown And Anchored Menu Placement

- For dropdowns, popovers, and anchored menus, placement must follow the trigger's visual position inside its control group, not just a generic default.
- If the trigger is the right-most action in a horizontal control bar or floating bottom switcher, prefer opening upward and right-aligned to that trigger first.
- If the trigger is integrated into an existing shared control block, keep it inside that same block; do not split it into a neighboring standalone surface unless the user explicitly wants a separate control island.
- When using `AnchoredMenu` or `openTopbarDropdown`, set explicit placement/fallbacks for edge-mounted triggers instead of relying on ambiguous defaults.

### Styling Source Of Truth

- Keep repeated or long utility-class compositions in typed UI-layer style maps (`classNames`, variant maps, component option maps), not inline in business logic branches.
- Inline utility classes are acceptable for small one-off layout tweaks; avoid large repeated class strings across files.
- Add new colors/spacing/scales to `tailwind.config.js` when they represent reusable design tokens; do not hardcode repeated design values in feature code.
- Prefer extending `src/ui-lib/src` primitives and HUD variants over creating feature-local style dialects.
- Border usage should stay rare: prefer spacing/contrast/elevation first, and add borders only when affordance or contrast explicitly requires them.
- In chat UIs, message bubbles must not use border outlines; if a divider is needed, keep it at container/subsection level.
- On mobile/touch viewports, keep computed `font-size` for text-entry controls (`input`, `textarea`, editable select/search fields) at `16px` or larger to prevent browser auto-zoom on focus.
- If desktop needs smaller visual input text, apply that only from `md`/desktop breakpoints while preserving `16px` on mobile.
- For top-level workspace islands (canvas, kanban, time-clustering, AI chat), default to full-size/full-bleed layout without card chrome or decorative outer margins unless separation is functionally required.
- Time-clustering supports a functional docked-left compact island mode plus explicit fullscreen expansion; treat both as first-class layouts backed by one shared module state source.

### Reactive UI Boundaries

- Treat UI reactivity as a hybrid architecture with explicit channel boundaries, as documented in `docs/UI-ARCHITECTURE.md`.
- Keep canvas runtime reactivity (`Scene`/viewport/render-loop flows) isolated from module data-store reactivity.
- Keep module domain/view-model state in typed module-local streams/stores.
- Use global `window` custom events primarily for cross-module/app-shell integration, not as the default internal module state channel.
- Avoid duplicate parallel channels for the same state transition; prefer one authoritative reactive path per concern.

### App Runtime And Translations

- `src/app-runtime/AppRuntime.ts` is the authoritative app-level reactive container for locale and future shell-wide runtime preferences.
- Across bootstrap, module, app, and root-view boundaries, pass `AppRuntime` instead of raw `I18nService` when the dependency represents app-level runtime context.
- Mounted root views that read app-level runtime state must subscribe in `mount()` and unsubscribe in `unmount()`. Prefer `runtime.subscribe(listener, { emitCurrent: true })`.
- Keep app-global runtime state out of feature domain stores.
- Do not add bootstrap-level manual refresh fan-out for locale/runtime changes; mutate runtime and let subscriptions update the mounted roots.
- If UI copy must stay live across locale changes, keep a translation key or resolver and recompute on refresh instead of passing one-time translated strings through long-lived boundaries.
- Add translation keys to both `src/i18n/locales/en.ts` and `src/i18n/locales/uk.ts`, keep them semantic and stable, and use `i18n.formatDate(...)` instead of locale-implicit `Intl` calls.
- Persist user language changes through `UserApiService.setUserProfileLanguage(...)` rather than bypassing the API boundary.

### Script Conventions

- `npm run start:stable` must remain a built app served through `vite preview`, but using Vite `development` mode config and env loading.
- Do not replace `start:stable` with the Vite dev server, and do not point it at a production-mode build unless the user explicitly asks.

### Testing Discipline

- Do not add tests that exist only to increase coverage or to confirm static implementation details.
- Avoid low-value UI tests that only verify markup shape, CSS classes, spacing, icon presence, visual composition, or other presentation details with no user-facing behavior behind them.
- Do not add tests for the visual appearance of UI components unless the task explicitly asks for it or the visual state encodes important behavior that cannot be protected better at another level.
- Prefer tests that protect meaningful regressions: user interactions, state transitions, data flow, command execution, accessibility-critical behavior, conditional rendering with product meaning, and bug fixes that could realistically recur.
- When a change is purely presentational and does not alter behavior, do not create a new test just to prove the component still renders.
- Before adding a test, ask whether it would catch a costly regression or document important behavior. If not, skip it.

### Learning From Corrections

- When the user corrects the assistant and that correction reveals a stable project rule, a recurring mistake, a contradiction, or an important edge case, update `AGENTS.md` in the same task unless the user explicitly says not to.
- Only promote corrections into `AGENTS.md` when they are durable guidance for future work, not one-off preferences or temporary task details.
- Keep new rules concrete and actionable so they improve future decisions instead of adding vague process noise.
- If the user states that a documentation file already exists on their latest branch state, do not create a replacement file with the same intent. First verify branch sync status and only proceed with file creation after explicit confirmation.

### Scenario Self-Improvement

- When the assistant completes a task through a scenario that is not yet documented, it must decide whether that scenario is likely to recur.
- If the scenario is reusable, stable, and likely to appear again, create the scenario documentation in the same task.
- Put the detailed scenario instructions near the owning module, usually in a local `AGENTS.md` or module `README.md`.
- Add a short scenario entry to the root `AGENTS.md` scenario index that states when to use it, the owning module, the document to read first, and the expected result.
- Default to creating a new scenario after implementing a new feature or workflow when that work establishes a repeatable path the assistant can follow faster next time.
- Do not create a scenario for one-off, highly unique, temporary, exploratory, or rarely repeated work.
- Promote only scenarios that reduce future project analysis, speed up execution, and are likely to be used repeatedly.

### Documentation Scope

- Keep feature-specific docs focused on that feature's own product scope, domain model, UX, and architecture.
- Document cross-cutting platform strategy in `docs/PROJECT.md` or a dedicated top-level doc under `docs/`, not inside a feature-specific doc, unless the integration or rule is genuinely unique to that feature.

### Canvas Connection Invariant

- For canvas planning elements, treat connections as unique per unordered pair of elements: at most one connection may exist between any two elements, regardless of direction.
- Do not create a second reverse-direction connection for an already connected pair.
- When the user wants the opposite direction for an existing directional connection, update or redirect the existing connection instead of creating another one.
- For story-goal links, the user-facing connect direction is `story -> goal` only.
- The stored `ParentChild` relation normalizes that pair as `goal -> story`; UI affordances must not expose that storage direction as a separate reverse action.
- A story may link to only one goal at a time; batch affordances must not offer one story -> many goals actions.

### Canvas Menu Boundaries

- Treat `SelectionActionMenu` and `ContextMenu` as separate interaction systems with different UX goals and visual component needs.
- Do not reuse one menu's feature-level visual buttons, menu rows, or other UI elements as the implementation pattern for the other.
- Reuse shared services, commands, state, and other non-visual logic across both menus when it fits.
- When adding new context-menu capabilities, design the UI against `ContextMenu` and its own primitives first, even if a superficially similar interaction already exists in `SelectionActionMenu`.

## Scenario Index

### Add Shared HUD Icon

- Use when the request is to add, rename, replace, or remove a reusable icon, especially when the user provides an SVG snippet or an icon name.
- Owner: `src/ui-lib/src/hud`
- Read first: `src/ui-lib/src/hud/AGENTS.md`
- Expected result: update the shared icon registry in `src/ui-lib/src/hud/icons.ts`, keep feature re-exports thin, use the local fast path for direct icon swaps, and avoid broad validation when the change is only static icon registration.

### Extend Canvas Context Menu

- Use when the request changes canvas `ContextMenu` sections, adds a new menu item type, or restructures how context-menu items render.
- Owner: `src/features/canvas/ui`
- Read first: `src/features/canvas/ui/AGENTS.md`
- Expected result: extend `ContextMenu` through its own item model and renderers, keep its visuals separate from `SelectionActionMenu`, and move reusable context-menu primitives into HUD when needed.

### Standardize UI Component Composition

- Use when the request asks how to structure components, where styling rules should live, whether to use HTML templates, or how to unify UI patterns across modules.
- Owner: `src/ui-lib` + `docs`
- Read first: `docs/UI-ARCHITECTURE.md`
- Expected result: keep a stable split between Tailwind tokens, TypeScript component recipes/behavior, and limited template usage for static fragments; avoid large-scale rewrites unless explicitly requested.

### Audit And Enforce UI Style Guidelines

- Use when the request is to define concrete style rules (colors, spacing, radii, borders, shadows, typography, control sizing), audit current non-canvas UI consistency, or prepare migration priorities.
- Owner: `docs` + `src/ui-lib` + non-canvas feature modules
- Read first: `docs/UI-STYLE-GUIDELINES.md`
- Expected result: maintain one practical style policy for new work, identify divergence hotspots, and prioritize incremental convergence to shared ui-lib/hud primitives.

### Align Reactive UI Channels

- Use when the request discusses reactive behavior, event flow cleanup, stream-vs-event decisions, or module UI update consistency.
- Owner: `docs` + feature modules
- Read first: `docs/UI-ARCHITECTURE.md`
- Expected result: preserve separated reactive channels by concern (canvas runtime, module stores, global integration, local control state), while reducing duplicate or ambiguous event pathways.

### Extend App Runtime Or Translations

- Use when the request changes app-wide locale behavior, adds a new app-level runtime preference, or fixes live update inconsistencies across mounted views.
- Owner: `src/app-runtime` + `src/i18n` + affected root views
- Read first: `src/app-runtime/AGENTS.md`
- Expected result: keep `AppRuntime` as the cross-module runtime boundary, keep feature stores free of app-global state, update mounted roots through runtime subscriptions, and keep translations live-safe across locale changes.

### Refine Workspace Sidebar UX

- Use when the request targets left sidebar polish, spacing/visual consistency, rail interaction states, or sidebar-specific accessibility behavior.
- Owner: `src/bootstrap` + `src/features/shell` + `docs`
- Read first: `docs/UI-SIDEBAR-GUIDELINES.md`
- Expected result: keep sidebar geometry and state styles aligned with shared UI standards, move repeated sidebar style recipes toward shared primitives/style maps, and preserve clear keyboard/focus semantics for icon-rail actions.

### Implement User Profile Settings

- Use when the request is to implement or extend profile/account settings UI and flows.
- Owner: `src/features/shell` + `src/app-runtime` + `src/majom-wrapper/data-access`
- Read first: `docs/USER-PROFILE-SETTINGS-IMPLEMENTATION.md`
- Expected result: a reusable profile settings surface integrated from app menu, with phased delivery (MVP account/language/wallpaper/delete, then security and personalization).

### Design Tactical Layer For Kanban Execution

- Use when the request is to evolve Kanban beyond temporary date/status distribution rules, introduce tactical planning, or define flow/capacity-based handoff into execution.
- Owner: `docs` + `src/features/kanban` + `src/majom-wrapper/interfaces`
- Read first: `docs/KANBAN-TACTICAL-EXECUTION-DESIGN.md`
- Expected result: a clear split between strategy (canvas), tactics (flows/capacity), and execution (Kanban), with an explicit roadmap for replacing temporary distribution logic.
