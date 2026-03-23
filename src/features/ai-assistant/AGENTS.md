# AI Assistant Module Rules

## Documentation

- The module architecture reference lives in `README.md` in this directory.
- Read `README.md` before changing routing, intent handling, command specs, structured reply contracts, confirmation flow, or execution behavior.
- When behavior changes materially, update `README.md` in the same change.

## Interpretation

- Never use regex, regex-like pattern matching, punctuation heuristics, or local lexical signal matching to interpret user intent, routing, semantic scope, workflow mode, or action meaning.
- Treat user-authored text as multilingual, open-world input. Interpretation must not depend on narrow lexical traps or language-specific regex shortcuts.
- Do not replace regex with token lists, prefix tables, phrase dictionaries, keyword bags, stem matching, or similar local prompt-interpretation shortcuts. That is the same architectural mistake in a different form.
- For semantic interpretation, prefer structured state, explicit user-selected intent, model classification, explicit evidence, or typed command context.
- Regex is allowed only for syntax-level parsing where the format itself is regex-shaped, such as fenced-code extraction, transport envelopes, or simple document markup parsing. It must not be used to decide what the user means.

## Why

- Regex-based interpretation is brittle across languages, inflections, punctuation, mixed-language prompts, and paraphrases.
- It hides product logic inside string tricks that are hard to reason about, hard to test, and easy to regress.
- Semantic decisions in the assistant should stay explainable, language-tolerant, and grounded in explicit rules or evidence.
