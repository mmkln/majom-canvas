# Flows Module Rules

## Scope

- Owns the product-facing Flows workspace under `src/features/flows`.
- Treat `src/majom-wrapper/data-access/flows-api-service.ts` as the backend API boundary for flow entities.
- Treat `FlowsStore` as the single owner of flow query state, loaded data, and request lifecycle.
- For Flow Focus work, read `docs/FLOW-FOCUS-CONTRACT.md` before changing frontend or backend contracts.
- Treat `Flow.meta` as a generic future-use record (`Record<string, unknown> | null`) matching Boards metadata; do not predefine a product shape until a concrete flows feature needs it.
- Persist flow column ordering as top-level `Flow.meta.pos`; do not store column position under `meta.presentation` or call it `order`.

## Workflow

1. Keep module wiring split into `FlowsModule` for shell registration, `FlowsApp` for dependency assembly/lifecycle, `FlowsStore` for state and side effects, and `FlowsView` for rendering.
2. Keep the page transparent over the app workspace wallpaper; background image ownership stays in `RuntimeHost`, matching `focus-board`.
3. Put repeated flow page classes in `ui/flowsStyles.ts`; do not inline long utility strings in store or app wiring.
4. Use `AppRuntime` for live translations in mounted views and do not put app-global runtime state into `FlowsStore`.
5. Add behavior tests around store request lifecycle and shell availability guards when adding new flows interactions.
6. Keep `FlowsView` state updates on a stable page shell with keyed flow-column DOM reconciliation. Collapse, reorder, hide/show, and modal-local updates must not rebuild the whole flows page root.
7. Use a per-column view/controller boundary for flow columns. `FlowsView` should own shell/order/overlays, while column-level DOM identity and update decisions stay in the column view layer.
8. Keep flow column updates section-keyed inside `FlowColumnView`: root/collapsed/header/tasks updates should be independently keyed so task refreshes do not replace headers and header edits do not replace task lists.
