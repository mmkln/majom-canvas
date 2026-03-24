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
- Expected result: update the shared icon registry in `src/ui-lib/src/hud/icons.ts`, keep feature re-exports thin, and avoid tests when the change is only static icon registration.

### Extend Canvas Context Menu

- Use when the request changes canvas `ContextMenu` sections, adds a new menu item type, or restructures how context-menu items render.
- Owner: `src/features/canvas/ui`
- Read first: `src/features/canvas/ui/AGENTS.md`
- Expected result: extend `ContextMenu` through its own item model and renderers, keep its visuals separate from `SelectionActionMenu`, and move reusable context-menu primitives into HUD when needed.
