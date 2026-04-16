# Majom Operating Loop UX Contract

## Status

- State: proposal
- Started: 2026-04-15
- Scope: define the user-facing interaction model for the Majom operating loop

## Why This Document Exists

The Majom operating loop cannot be implemented correctly through raw domain state alone.

The user needs to see:

- what is dominant,
- what is merely supporting,
- what is intentionally not carried,
- where the day is protected,
- how reality will answer back,
- how to recover after a break.

If these decisions stay implicit, the UX will collapse back into a generic planner.

## Product-Level UX Rule

The system should always answer one core question clearly:

`What is the one main contour I am actually carrying right now?`

Everything else should reinforce that answer.

## Main Operating Surfaces

### 1. Contour Selection Surface

Purpose:

- compress many serious lines into one operating hierarchy.

Must show:

- the current `Main`,
- current `Support`,
- current `Admin`,
- current `Parked`.

Must allow:

- promoting one contour to `Main`,
- demoting others,
- clearly parking serious lines.

Must not:

- allow many visually equal active “main” items,
- hide parked tradeoffs,
- treat role assignment as optional metadata.

### 2. Day Architecture Surface

Purpose:

- build one day around the dominant contour.

Must show:

- `Main Block`
- `Support Block`
- `Reactive/Admin Block`
- `Buffer/Recovery Block`

Must make visible:

- whether the day starts correctly,
- whether the main block is protected,
- whether the reactive layer is entering too early.

### 3. Reality Contact Surface

Purpose:

- make external truth visible, not implicit.

Must show:

- what external signal is expected,
- whether it was sent,
- whether feedback returned,
- whether the contour is still only internal preparation.

### 4. Recovery Surface

Purpose:

- restore the operating core after failure.

Must show:

- what broke,
- how severe it was,
- what the smallest restart set is,
- whether the system is still in recovery mode.

## Core User Flows

### Flow A: Select the Main Contour

User intent:

- “I need to stop carrying too many serious things at once.”

Required outcome:

- exactly one contour becomes `Main`,
- the rest are downgraded to `Support`, `Admin`, or `Parked`,
- the user sees the tradeoff explicitly.

### Flow B: Build the Day Around Main

User intent:

- “I want the day to serve the main contour instead of noise.”

Required outcome:

- one protected `Main Block`,
- limited support blocks,
- reactive work pushed later,
- visible buffer for failure or spillover.

### Flow C: Attach Reality Contact

User intent:

- “How will I know this line touches reality?”

Required outcome:

- the main contour has a clear external signal,
- preparation and confrontation are visually distinct.

### Flow D: Recover After Breakdown

User intent:

- “The day broke. I need the system to give me the smallest real restart.”

Required outcome:

- one recovery classification,
- one main restart move,
- one support restart move,
- one stabilizing move.

## Visibility Priorities

The UI should rank visibility in this order:

1. current `Main`
2. day protection around `Main`
3. active WIP pressure
4. reality contact status
5. recovery state
6. supporting context
7. parked context

This means:

- one main contour should be more visible than backlog volume,
- one day architecture signal should be more visible than general task lists,
- one missing reality contact warning should be more visible than decorative planning detail.

## Required UI Signals

### Role clarity

The user should instantly see:

- what is `Main`,
- what is `Support`,
- what is `Admin`,
- what is `Parked`.

### WIP clarity

The user should instantly see:

- how many serious fronts are active,
- whether the system is overloaded,
- what has to be parked before adding something new.

### Day protection clarity

The user should instantly see:

- whether the day starts with main or with reactivity,
- whether the main block is protected,
- whether buffer/recovery exists.

### Reality clarity

The user should instantly see:

- whether the contour has any external test,
- whether that test is upcoming, active, or missed.

### Recovery clarity

The user should instantly see:

- whether they are in recovery mode,
- what the minimal restart path is.

## UX Anti-Patterns

Do not:

- show many equally loud priority surfaces,
- treat everything important as active,
- make the day start from inbox or event noise by default,
- blur support work into co-main work,
- hide parked work completely,
- use recovery as a full-plan rebuild flow,
- replace reality contact with descriptive prose.

## How Existing Modules Should Behave

### Canvas

Canvas should answer:

- what exists structurally,
- how work relates,
- what hierarchy the contour can anchor to.

Canvas should not answer:

- which line is currently `Main`,
- what the protected day is,
- or what the live WIP limit is.

### Kanban

Kanban should answer:

- what the current execution intake is,
- what is now,
- what is next,
- what is waiting.

Kanban should not decide tactical hierarchy on its own.

### Time Clustering

Time clustering should answer:

- how the day is arranged,
- whether the main contour is actually protected in time.

Time clustering should not behave like an unrelated optional calendar toy.

### AI Assistant

AI should answer:

- where the loop is weak,
- what is structurally overloaded,
- what recovery move is valid,
- what reality contact is missing.

AI should not behave like the hidden owner of operating-loop state.

## MVP UX Scope

For MVP, the operating-loop UX only needs to support:

1. assign contour roles,
2. select one `Main`,
3. show WIP pressure,
4. build a protected day shape,
5. attach one reality contact to `Main`,
6. trigger one structured recovery path.

That is enough to prove the operating model.

## UX Contract Summary

If the implementation is correct, the user should always be able to answer:

- What is my one main contour right now?
- What did I consciously downgrade?
- Is my day protecting the main contour or losing it?
- What external signal proves movement?
- If I broke the loop, what is the smallest way back?
