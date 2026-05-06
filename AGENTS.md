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

- When replacing existing controls with `HudSurface` or ui-lib primitives, preserve the existing control grouping and page structure unless the user explicitly asks for a structural redesign.
- Do not extend shared ui-lib primitive APIs for a single feature-local composition need unless the user explicitly asks for a reusable primitive change.

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
- Do not use hover "lift" motion as a default affordance for cards, list rows, buttons, or other standard controls. Avoid hover-time `translateY`, jump, float, or similar vertical movement to indicate interactivity.
- Prefer stable hover signals such as background, border, shadow, underline, or text/icon color changes instead of moving the element itself.
- Do not generate nested “bubble UI” by default. Treat the following as an anti-pattern unless there is a clear functional reason: page shell with border/shadow, containing a bordered workspace card, containing bordered section cards, containing bordered sub-cards, containing pill/bubble wrappers for routine content.
- For product/workspace screens, assume one dominant structural surface is enough. If the screen already has a workspace shell or page region, inner sections should usually be organized by spacing, typography, dividers, or subtle background shifts instead of repeated rounded bordered cards.
- When reviewing or generating UI, explicitly ask: `Can I remove one whole layer of card/border/shadow wrapping without losing meaning or affordance?` If yes, remove it.
- Nested card/chrome is allowed only when each layer has a different job that the user can perceive immediately, for example: modal over page, floating inspector over workspace, or selected sub-surface with clearly different interaction semantics.
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

### Workspace Session State

- Treat the current workspace view as tab/window-scoped runtime state, not as a global user profile preference.
- Persist per-tab active workspace restore through `sessionStorage`, so reload returns the same tab to its own workspace without affecting other windows.
- Do not write routine workspace switches into `user.meta.workspace.defaultView`; reserve that field for an explicit long-lived start/default preference.
- When restoring a workspace view, prefer tab session state first, then the explicit profile default, then `canvas`, and always validate the result against feature availability.
- Persist a session workspace view only after the target workspace has mounted successfully.
- Do not let profile preference refreshes live-switch an already open tab's current workspace view.

### Canvas Tab Session State

- Treat the active canvas id and canvas viewport view state as tab/window-scoped session state when the behavior represents where the user is working right now.
- Persist per-tab active canvas and pan/zoom through `sessionStorage`, so reload returns each tab to its own canvas and viewport without affecting other windows.
- Do not write routine canvas selection or viewport changes as the source of truth for `user.meta.canvasSession.lastOpenedCanvasId`; reserve profile canvas session fields for migration, fallback, and explicit long-lived defaults.
- When restoring a canvas, prefer tab session active canvas first, then profile fallback, then the first available canvas, and validate restored ids against the canvases returned by the API.
- Keep `CanvasDataService.setActiveCanvas(...)` as a runtime state setter without hidden profile persistence side effects; persist tab session state from the canvas activation lifecycle after the session is accepted.

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
- Do not add standalone tests just because a locale was added, a translation catalog grew, or copy changed in one language.
- Small locale-related tests may stay when they protect real behavior such as locale normalization, runtime switching, persistence, or shared language-selector wiring.
- Prefer tests that protect meaningful regressions: user interactions, state transitions, data flow, command execution, accessibility-critical behavior, conditional rendering with product meaning, and bug fixes that could realistically recur.
- When a change is purely presentational and does not alter behavior, do not create a new test just to prove the component still renders.
- Before adding a test, ask whether it would catch a costly regression or document important behavior. If not, skip it.
- If you temporarily add a visual-only or implementation-detail assertion to verify a UI change, delete it before finishing the task unless it clearly protects meaningful behavior under the rules above.
- The assistant may create temporary self-check tests or short-lived verification harnesses while implementing a change, but they must be deleted after verification unless they clearly protect meaningful product behavior under the rules above.
- Do not leave behind ad hoc tests, throwaway fixtures, or one-off verification files that exist only to validate the assistant's current implementation pass.

### Bug-Fix Testing Workflow

- Before changing code for a bug fix, first reproduce and localize the bug with tests.
- Do not start a speculative fix until the root cause is identified with high confidence through a failing or diagnostic test at the right level (`integration` first by default, then `unit` if needed to isolate further).
- If the user explicitly asks to find the bug with tests first, do not implement a fix until a focused automated test fails on the buggy behavior.
- If no test fails yet, treat the bug as not correctly identified yet; continue narrowing with tests or report that the failure has not been proven.
- Treat bug-fix work as a two-step process:
  1. create or run the smallest test that reliably reproduces the bug and proves the root cause;
  2. only then implement the fix and keep the regression protection that guards the real behavior.
- Prefer focused integration tests for bug localization because most regressions happen at module boundaries; add unit tests only after the suspect logic is narrowed down.
- If the cause cannot be proven through automated tests because the issue depends on external systems, browser quirks, or manual-only behavior, explicitly state that limitation before applying a fix and add the strongest reproducible test coverage that is still possible.
- For interactive bug hunts, follow this narrowing sequence explicitly:
  1. generate focused tests until one fails and reveals the buggy flow;
  2. delete or avoid keeping broad exploratory tests that no longer help;
  3. narrow the search around the failing case with smaller targeted tests until the faulty boundary is clear;
  4. only then propose and implement the minimal fix;
  5. rerun the focused tests and any nearby regression tests to confirm the fix.

### Architecture Escalation Rule

- For any non-trivial feature, workflow, or interactive UI change, do not keep patching an existing implementation if the work exposes weak state ownership, hidden coupling, duplicated control flow, or unclear UX semantics.
- Before implementing, explicitly identify:
  - the single owner of state;
  - the source of truth for requests and side effects;
  - the user-visible interaction model;
  - the most likely failure modes.
- Classify the task as either `patch-safe` or `redesign-required` before proceeding.
- Choose `redesign-required` by default if any of the following is true:
  - the solution would introduce or preserve duplicated state;
  - the same flow is controlled from more than one place;
  - multiple triggers can cause the same side effect independently;
  - the UX depends on hidden or “magical” behavior;
  - a second fix is being applied to the same interaction flow;
  - the implementation is accumulating local workarounds, coordination glue, or special cases.
- If the task is `redesign-required`, do not continue iterating on the weak baseline. First define:
  - the state model;
  - the event/update flow;
  - the API contract;
  - the UI contract.
- Do not present an incremental patch as a strong solution when it is only a temporary workaround. State plainly what weakness remains.

### Single Owner Rule

- For interactive flows, one model/controller must own query state, filter state, and request lifecycle.
- Do not split these responsibilities across multiple components unless there is a very clear boundary and a documented reason.
- If text input, filters, debouncing, reload logic, and result shaping are coordinated from different places, treat that as a design smell and redesign before continuing.

### Patch Limit Rule

- If two consecutive fixes touch the same interaction flow, stop patching and redesign the flow.
- Do not apply a third local fix to the same state/interaction model without first replacing the underlying design.
- When this threshold is reached, explicitly say that the current baseline is no longer patch-safe.

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

### AI-Native Incremental Refactoring

- For all implementation tasks (new features, bug fixes, and edits to existing functionality), apply at least one small AI-native refactor in the touched area unless a valid waiver applies.
- The default objective is to leave touched code more machine-checkable and less ambiguous without broad rewrites.
- Follow `docs/AI-NATIVE-INCREMENTAL-REFACTORING.md` for policy, measurable outcomes, waiver categories, and required reporting format.
- Keep refactors local and safe:
  - target approximately 5-15% extra diff in touched modules or 1-3 focused micro-refactors;
  - preserve behavior unless the task explicitly requests behavior change.
- Final summaries for code changes must include the AI-native reporting block (applied/skipped, type, what changed, boundary improved, or waiver reason with next safe opportunity).
- Prefer refactors that strengthen invariants, reduce duplicate reactive pathways, tighten boundary typing, and increase reuse of `src/ui-lib/src` primitives.

### Canvas Connection Invariant

- For canvas planning elements, treat connections as unique per unordered pair of elements: at most one connection may exist between any two elements, regardless of direction.
- Do not create a second reverse-direction connection for an already connected pair.
- When the user wants the opposite direction for an existing directional connection, update or redirect the existing connection instead of creating another one.
- For story-goal links, the user-facing connect direction is `story -> goal` only.
- The stored `ParentChild` relation normalizes that pair as `goal -> story`; UI affordances must not expose that storage direction as a separate reverse action.
- A story may link to only one goal at a time; batch affordances must not offer one story -> many goals actions.

### Canvas Relations vs Domain Relations Boundary

- Treat canvas relations and domain relations as different systems with different responsibilities; never treat one as an alias of the other.
- Canvas relations are visualization/runtime graph data for the canvas experience and should stay scoped to rendering-oriented interaction flows.
- Domain relations are business-model data and must be persisted, validated, and reasoned about through explicit domain contracts.
- Do not infer domain truth from canvas relation state, and do not use domain relation storage as a drop-in replacement for canvas visualization state.
- If a feature needs both relation kinds, define a clear synchronization/projection contract with one declared source of truth per relation concern.

### Canvas Draw Color Roles

- For canvas element `draw()` methods, do not introduce raw hex colors directly in rendering branches.
- Resolve colors through `canvasTheme` roles (node status roles, interaction roles, anchors/handles/guides roles, or dedicated new roles added to the theme palette).

### Canvas vs Canvas-Core Boundary

- Treat `src/features/canvas` and `src/features/canvas-core` as different architecture layers with different responsibilities.
- For product-facing canvas work, treat `src/features/canvas` as the active canvas application/runtime by default.
- If the user says `canvas` without explicitly naming `canvas-core`, interpret that request as `src/features/canvas` only.
- For ordinary `canvas` requests, assume the user means the old/current canvas in `src/features/canvas`.
- Do not inspect, analyze, or edit `src/features/canvas-core` for a `canvas` request unless the user explicitly says the work belongs in `canvas-core`.
- Even when the user explicitly mentions `canvas-core`, do not proceed automatically. First ask for the password for `canvas-core` work.
- The required password for `canvas-core` work is `вяся`.
- Until the user provides the exact password `вяся`, treat `src/features/canvas-core` as off-limits and continue assuming the task belongs to the old canvas in `src/features/canvas`.
- Do not assume `src/features/canvas-core` is the current canvas app entrypoint, a migration target, or a future replacement runtime unless the user explicitly says so.
- If the request is about behavior a user sees in the current canvas UI, start from `src/features/canvas` and verify the boot/runtime path before editing `canvas-core`.
- `src/features/canvas` must not depend on `src/features/canvas-core` as a feature-layer dependency.
- The only acceptable exception is a small, clean, dependency-light module that is deliberately shaped as a shared leaf utility or contract and can be used independently by both `canvas` and `canvas-core` without pulling product logic across the boundary.
- If code seems reusable but currently lives inside `canvas-core`, do not make `canvas` depend on that module by default. First decide whether it should stay engine-only, move to `canvas`, or be extracted into a neutral shared module.
- `src/features/canvas` owns concrete planning/domain entities and product-facing behavior such as `GoalElement`, `StoryElement`, `TaskElement`, status presentation, planning-specific menus, and feature semantics.
- `src/features/canvas-core` must be treated as the engine layer: scene graph, rendering infrastructure, generic commands, alignment, selection mechanics, primitives, and reusable canvas runtime utilities.
- Do not answer questions about concrete canvas entities by inspecting `canvas-core` first. Start from `src/features/canvas` unless the user explicitly asks about engine internals.
- Do not add new concrete planning entities, domain statuses, or product-specific UI semantics under `src/features/canvas-core`.
- If work in `canvas-core` seems to require importing or editing `GoalElement`, `StoryElement`, `TaskElement`, `HabitElement`, or similar domain entities, stop and classify the task as `redesign-required` before proceeding.
- If the requested behavior is product-level canvas workflow logic, implement it in `canvas` first. Do not place it in `canvas-core` unless the extracted part is a genuinely generic engine primitive with no `canvas` ownership baked into it.
- When touching both layers, state explicitly which concern belongs to `canvas` and which belongs to `canvas-core`; do not merge them in one explanation or one ownership boundary.

### Canvas Menu Boundaries

- Treat `SelectionActionMenu` and `ContextMenu` as separate interaction systems with different UX goals and visual component needs.
- Do not reuse one menu's feature-level visual buttons, menu rows, or other UI elements as the implementation pattern for the other.
- Reuse shared services, commands, state, and other non-visual logic across both menus when it fits.
- When adding new context-menu capabilities, design the UI against `ContextMenu` and its own primitives first, even if a superficially similar interaction already exists in `SelectionActionMenu`.

## Scenario Index

### Canvas Layering

- Use when the task touches both `src/features/canvas` and `src/features/canvas-core`, or when the user asks about boundaries, ownership, extraction, or architecture between them.
- Owner: `src/features/canvas` and `src/features/canvas-core`
- Read first: `src/features/canvas/ui/AGENTS.md` and `src/features/canvas-core/AGENTS.md`
- Expected result: product-specific entity work stays in `canvas`, engine work stays in `canvas-core`, and the answer does not mix the two layers.

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

### Define Theme Vs UI Mode Personalization

- Use when the request is to introduce platform-wide theme packs/skins, separate visual theme from density/focus modes, or plan runtime-backed UI personalization settings.
- Owner: `docs` + `src/app-runtime` + `src/ui-lib` + `src/features/shell`
- Read first: `docs/UI-THEMES-AND-UI-MODES-STRATEGY.md`
- Expected result: keep `theme` and `uiMode` as separate app-level preferences, roll out incrementally through ui-lib tokens/recipes, and avoid full rewrite style overhauls.

### Audit And Enforce UI Style Guidelines

- Use when the request is to define concrete style rules (colors, spacing, radii, borders, shadows, typography, control sizing), audit current non-canvas UI consistency, or prepare migration priorities.
- Owner: `docs` + `src/ui-lib` + non-canvas feature modules
- Read first: `docs/UI-STYLE-GUIDELINES.md`
- Expected result: maintain one practical style policy for new work, identify divergence hotspots, and prioritize incremental convergence to shared ui-lib/hud primitives.

### Refine Boards Trello-Like UI

- Use when the request changes the Boards feature card fronts, board header, list/card composers, or card details modal.
- Owner: `src/features/boards`
- Read first: `src/features/boards/AGENTS.md`
- Expected result: preserve Trello-like interaction semantics, including card fronts that open details and expose badges instead of destructive actions.

### Implement Boards Card Drag And Drop

- Use when the request changes card drag/drop, placement ordering, or reorder/move interactions in the Boards feature.
- Owner: `src/features/boards`
- Read first: `src/features/boards/AGENTS.md`
- Expected result: keep gesture lifecycle in `BoardDragController`, target resolution in pure domain helpers, and send semantic placement targets instead of frontend-owned numeric ranks.

### Implement Boards Column Drag And Drop

- Use when the request changes list/column drag/drop, column ordering, or board list reorder interactions in the Boards feature.
- Owner: `src/features/boards` + backend board column API
- Read first: `src/features/boards/AGENTS.md`
- Expected result: keep gesture lifecycle in `BoardColumnDragController`, target resolution in `columnTargetResolver`, and send semantic column targets instead of frontend-owned numeric ranks.

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

### Apply AI-Native Incremental Refactoring

- Use when implementing any code change, especially modifications to existing functionality that should gradually become easier for AI agents to evolve safely.
- Owner: `docs` + all feature modules
- Read first: `docs/AI-NATIVE-INCREMENTAL-REFACTORING.md`
- Expected result: requested behavior is delivered, touched areas include at least one small measurable AI-native refactor (or explicit waiver), and final reporting includes the required AI-native block.
