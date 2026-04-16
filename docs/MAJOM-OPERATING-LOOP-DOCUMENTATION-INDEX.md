# Majom Operating Loop Documentation Index

## Status

- State: active
- Started: 2026-04-15
- Scope: entrypoint for the Majom operating-loop documentation set

## Why This File Exists

The Majom operating-loop work is intentionally grouped under one shared prefix:

- `MAJOM-OPERATING-LOOP-`

This makes the whole documentation block easy to find with:

```bash
ls docs/MAJOM-OPERATING-LOOP-*
```

or:

```bash
rg "MAJOM-OPERATING-LOOP-" docs
```

## Document Set

Read these in order:

1. [MAJOM-OPERATING-LOOP-FIT-MATRIX.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-FIT-MATRIX.md:1)
   Compare the new operating-loop requirement against the current repository.
2. [MAJOM-OPERATING-LOOP-DOMAIN-SPEC.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-DOMAIN-SPEC.md:1)
   Define the core product vocabulary and domain objects.
3. [MAJOM-OPERATING-LOOP-STATE-AND-INVARIANTS.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-STATE-AND-INVARIANTS.md:1)
   Define the tactical source of truth, transition rules, and hard constraints.
4. [MAJOM-OPERATING-LOOP-IMPLEMENTATION-MATRIX.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-IMPLEMENTATION-MATRIX.md:1)
   Define the phased implementation order, touched modules, required tests, and exit criteria.
5. [MAJOM-OPERATING-LOOP-PHASE-1-CHECKLIST.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-PHASE-1-CHECKLIST.md:1)
   Break Phase 1 into concrete file-level tasks with checkboxes, guardrails, and detailed completion criteria.
6. [MAJOM-OPERATING-LOOP-UX-CONTRACT.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-UX-CONTRACT.md:1)
   Define what the user-facing operating loop must look like.
7. [MAJOM-OPERATING-LOOP-PERSISTENCE-AND-INTEGRATION.md](/Users/mmikulin/Library/CloudStorage/OneDrive-DataXstream/Desktop/untitled%20folder/majom-canvas/docs/MAJOM-OPERATING-LOOP-PERSISTENCE-AND-INTEGRATION.md:1)
   Define storage, module boundaries, and rollout integration into the current codebase.

## Recommended Reading Pattern

Use this sequence for implementation planning:

1. confirm the fit and the current gaps,
2. lock the product terms,
3. lock the tactical state owner and invariants,
4. lock the phased implementation matrix,
5. lock the UX contracts,
6. only then start implementation planning.

## Important Boundary

This documentation set is about the Majom operating loop specifically.
It is not a rewrite plan for the whole app.

The intended architecture remains:

- `canvas` for strategic structure,
- a new tactical owner for operating-loop logic,
- `kanban` as execution projection,
- `time-clustering` as day-architecture projection,
- AI as an assistant over the tactical loop.
