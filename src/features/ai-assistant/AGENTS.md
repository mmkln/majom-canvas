# AI Assistant Module Rules

## Documentation

- `README.md` in this directory is the primary architecture reference.
- Read `README.md` before changing architecture, routing, scenarios, actions, parser behavior, execution, memory, or telemetry.
- When behavior changes materially, update `README.md` in the same change.
- Treat `scenario` as the main runtime abstraction. `intent` and `intentContext` are compatibility metadata unless a task explicitly says otherwise.

## Interpretation

- Never use regex, regex-like pattern matching, punctuation heuristics, or local lexical signal matching to interpret user intent, routing, semantic scope, workflow mode, or action meaning.
- Treat user-authored text as multilingual, open-world input. Interpretation must not depend on narrow lexical traps or language-specific regex shortcuts.
- Do not replace regex with token lists, prefix tables, phrase dictionaries, keyword bags, stem matching, or similar local prompt-interpretation shortcuts. That is the same architectural mistake in a different form.
- For semantic interpretation, prefer structured state, explicit user-selected intent, model classification, explicit evidence, or typed command context.
- Regex is allowed only for syntax-level parsing where the format itself is regex-shaped, such as fenced-code extraction, transport envelopes, or simple document markup parsing. It must not be used to decide what the user means.

## Scenario And Action Work

- Implement or fix scenarios by updating the scenario map in `README.md` first, then align resolver, command spec, context shaping, and telemetry behavior to that map.
- Implement or fix actions by keeping the action plan, structured reply contract, parser normalization, and execution behavior consistent with the resolved scenario.
- Build scenario telemetry and memory metadata through the shared helper in `services/AiAssistantTelemetryTypes.ts` instead of reassembling `scenarioId`, `scenarioMode`, `scenarioKind`, `routeLength`, or `proposalStyle` locally.
- Do not introduce legacy intent-era bridge behavior when a scenario or action-plan path already exists.
- Prefer explicit scenario state and evidence over inferred intent text.

## Why

- Regex-based interpretation is brittle across languages, inflections, punctuation, mixed-language prompts, and paraphrases.
- It hides product logic inside string tricks that are hard to reason about, hard to test, and easy to regress.
- Semantic decisions in the assistant should stay explainable, language-tolerant, and grounded in explicit rules or evidence.

## Chat Action Card UI

- Keep compact chat action cards to at most 3 text levels within a single card:
  - primary: title and reviewable payload values
  - secondary: summary and rationale body
  - tertiary: section headings, field labels, provenance, and other support text
- Do not introduce extra local font-size or text-color overrides inside one action family unless they add a genuinely new semantic level.
- In `suggest_update`, treat `Changes` as the single primary payload block and `Why` as a secondary note. They must not read as two equally strong blocks.
- Do not hide `medium` priority in chat action cards.
- Priority indicators in chat action cards must use the same icon vocabulary and color mapping as the priority selector in `canvas/ui/components/EditElementModal.ts`. Prefer icon chips over text chips for action-card priority badges.
- For `create_task` and `create_story` action cards, do not render target-container meta under the title. Generic target context like `Story`, `Goal`, `Selected story`, or `Selected goal` is noise in this UI.
