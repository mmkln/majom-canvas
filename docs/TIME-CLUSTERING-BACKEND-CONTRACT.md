# Time Clustering Backend Contract

This document defines the backend contract for the current Time Clustering frontend implementation.

It is based on the current frontend model and behavior in:

- `src/features/time-clustering/domain/types.ts`
- `src/features/time-clustering/domain/rules.ts`
- `src/features/time-clustering/state/TimeClusteringStore.ts`
- `src/features/time-clustering/data/TimeClusteringRepository.ts`

The goal is to let backend implementation start without reverse-engineering the frontend.

## Current Frontend Scope

The current frontend supports:

- one-off clusters
- recurring clusters with:
  - `none`
  - `daily`
  - `weekdays`
  - `weekly`
- weekly recurrence day selection
- recurrence end date
- cluster title
- cluster description
- cluster color token
- direct start/end ISO timestamps
- whole-state persistence through a repository abstraction

The frontend currently stores and restores a full state snapshot, so the fastest backend integration path is a snapshot-based API.

## Core Domain Types

```ts
type TimeClusteringLayoutMode = 'docked-left' | 'fullscreen';

type TimeClusterRecurrence =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekly';

type TimeCluster = {
  id: string;
  title: string;
  description: string;
  colorToken:
    | 'blue'
    | 'green'
    | 'amber'
    | 'rose'
    | 'violet'
    | 'cyan'
    | 'orange'
    | 'teal'
    | 'indigo';
  startAtIso: string;
  endAtIso: string;
  recurrence: TimeClusterRecurrence;
  recurrenceEndDateKey: string | null;
  recurrenceWeekdays?: number[];
};

type DuplicationWarning = {
  type: 'time-collision';
  sourceClusterId: string;
  targetClusterId: string;
};

type TimeClusteringStateSnapshot = {
  selectedDateKey: string;
  weekAnchorDateKey: string;
  clusters: TimeCluster[];
  lastWarnings: DuplicationWarning[];
};
```

## Field Semantics

### `id`

- stable cluster identifier
- use UUID on backend

### `title`

- required
- non-empty string on save

### `description`

- optional in UI input, but recommended to persist as a string
- backend should normalize missing values to `""`
- currently shown only in edit modal

### `colorToken`

Current supported values:

- `blue`
- `green`
- `amber`
- `rose`
- `violet`
- `cyan`
- `orange`
- `teal`
- `indigo`

Backend may store as plain string, but validating against this set is recommended.

### `startAtIso`, `endAtIso`

- ISO datetime strings
- frontend expects UTC-safe ISO strings
- backend should return canonical ISO strings

### `recurrence`

Allowed values:

- `none`
- `daily`
- `weekdays`
- `weekly`

### `recurrenceEndDateKey`

- format: `YYYY-MM-DD`
- `null` for non-recurring clusters
- for recurring clusters, may be `null` or a concrete end date

### `recurrenceWeekdays`

- only meaningful for `weekly`
- array of unique weekday integers using JS convention:
  - `0 = Sunday`
  - `1 = Monday`
  - `2 = Tuesday`
  - `3 = Wednesday`
  - `4 = Thursday`
  - `5 = Friday`
  - `6 = Saturday`

If omitted for `weekly`, frontend normalizes it from the weekday of `startAtIso`.

### `selectedDateKey`, `weekAnchorDateKey`

- format: `YYYY-MM-DD`
- UI state, not cluster state
- required for restoring the same calendar context after reload

### `lastWarnings`

Currently only supports:

```ts
{ type: 'time-collision', sourceClusterId: string, targetClusterId: string }
```

These are derived UI warnings. Backend may either:

- persist them as part of the snapshot for compatibility
- or recompute them before returning snapshot data

For the current frontend contract, including them in the returned snapshot is the safest option.

## Required Backend Validation

Backend should enforce the same functional rules as the frontend:

### Time validation

- `startAtIso` must be a valid datetime
- `endAtIso` must be a valid datetime
- `endAtIso > startAtIso`
- minimum duration: `15` minutes

### Recurrence validation

- `recurrence` must be one of the allowed enum values
- if `recurrence === 'none'`:
  - `recurrenceEndDateKey` should be normalized to `null`
  - `recurrenceWeekdays` should be ignored or removed
- if `recurrence === 'weekly'`:
  - `recurrenceWeekdays` must contain only unique integers `0..6`
  - if absent, backend may derive it from `startAtIso`
- if `recurrence !== 'weekly'`:
  - `recurrenceWeekdays` should be ignored or removed
- if `recurrenceEndDateKey` is present:
  - it must be a valid `YYYY-MM-DD`
  - it must not be earlier than the date portion of `startAtIso`

### String normalization

- `title` should be trimmed
- `description` should default to `""`
- `colorToken` should be validated or normalized

## Recommended Persistence Model

### Table: `time_clusters`

```sql
create table time_clusters (
  id uuid primary key,
  user_id uuid not null,
  title text not null,
  description text not null default '',
  color_token text not null,
  start_at_utc timestamptz not null,
  end_at_utc timestamptz not null,
  recurrence text not null,
  recurrence_end_date date null,
  recurrence_weekdays smallint[] null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Table: `time_clustering_state`

```sql
create table time_clustering_state (
  user_id uuid primary key,
  selected_date date not null,
  week_anchor_date date not null,
  updated_at timestamptz not null default now()
);
```

### Optional Table: `time_clustering_warnings`

This is not required if warnings are recomputed dynamically.

## API Option A: Snapshot API

This is the best option if the goal is to connect the current frontend quickly with minimal refactoring.

### Endpoints

```http
GET    /api/time-clustering/snapshot
PUT    /api/time-clustering/snapshot
DELETE /api/time-clustering/snapshot
```

### `GET /api/time-clustering/snapshot`

Response:

```json
{
  "selectedDateKey": "2026-03-27",
  "weekAnchorDateKey": "2026-03-27",
  "clusters": [
    {
      "id": "f4d73c4d-5d7d-4b83-8e69-1d2f77b6c201",
      "title": "Deep work",
      "description": "Focus block for backend integration",
      "colorToken": "blue",
      "startAtIso": "2026-03-27T08:00:00.000Z",
      "endAtIso": "2026-03-27T09:30:00.000Z",
      "recurrence": "weekly",
      "recurrenceEndDateKey": "2026-06-30",
      "recurrenceWeekdays": [5]
    }
  ],
  "lastWarnings": []
}
```

### `PUT /api/time-clustering/snapshot`

Request body:

```json
{
  "selectedDateKey": "2026-03-27",
  "weekAnchorDateKey": "2026-03-27",
  "clusters": [],
  "lastWarnings": []
}
```

Behavior:

- replace the stored snapshot for the current user
- validate and normalize clusters before saving
- return the normalized saved snapshot

### `DELETE /api/time-clustering/snapshot`

Behavior:

- clear the current user's time clustering state

## API Option B: Structured API

This is the better long-term backend design, but it requires a frontend repository adapter instead of direct snapshot persistence.

### Endpoints

```http
GET    /api/time-clustering/state
PUT    /api/time-clustering/state

GET    /api/time-clustering/clusters
POST   /api/time-clustering/clusters
PATCH  /api/time-clustering/clusters/:id
DELETE /api/time-clustering/clusters/:id

POST   /api/time-clustering/actions/duplicate-day
GET    /api/time-clustering/warnings
```

### `GET /api/time-clustering/state`

```json
{
  "selectedDateKey": "2026-03-27",
  "weekAnchorDateKey": "2026-03-27"
}
```

### `PUT /api/time-clustering/state`

```json
{
  "selectedDateKey": "2026-03-27",
  "weekAnchorDateKey": "2026-03-27"
}
```

### `GET /api/time-clustering/clusters`

Recommended query params:

```http
GET /api/time-clustering/clusters?fromDateKey=2026-03-24&toDateKey=2026-03-31
```

Response:

```json
[
  {
    "id": "f4d73c4d-5d7d-4b83-8e69-1d2f77b6c201",
    "title": "Deep work",
    "description": "",
    "colorToken": "blue",
    "startAtIso": "2026-03-27T08:00:00.000Z",
    "endAtIso": "2026-03-27T09:30:00.000Z",
    "recurrence": "none",
    "recurrenceEndDateKey": null,
    "recurrenceWeekdays": null
  }
]
```

Important:

- backend should return raw clusters
- frontend builds calendar segments locally
- backend does not need to return day/week UI projections

### `POST /api/time-clustering/clusters`

```json
{
  "title": "Morning block",
  "description": "",
  "colorToken": "indigo",
  "startAtIso": "2026-03-30T07:00:00.000Z",
  "endAtIso": "2026-03-30T09:00:00.000Z",
  "recurrence": "none",
  "recurrenceEndDateKey": null,
  "recurrenceWeekdays": null
}
```

Response: created cluster

### `PATCH /api/time-clustering/clusters/:id`

```json
{
  "title": "Updated cluster",
  "description": "Notes from edit modal",
  "startAtIso": "2026-03-30T08:15:00.000Z",
  "endAtIso": "2026-03-30T09:45:00.000Z",
  "recurrence": "weekly",
  "recurrenceEndDateKey": "2026-05-01",
  "recurrenceWeekdays": [1, 3, 5]
}
```

Response: updated cluster

### `DELETE /api/time-clustering/clusters/:id`

Delete one cluster by id.

### `POST /api/time-clustering/actions/duplicate-day`

Request:

```json
{
  "sourceDateKey": "2026-03-27",
  "targetDateKey": "2026-03-28"
}
```

Response:

```json
{
  "clusters": [
    {
      "id": "new-cluster-id",
      "title": "Deep work",
      "description": "",
      "colorToken": "blue",
      "startAtIso": "2026-03-28T08:00:00.000Z",
      "endAtIso": "2026-03-28T09:30:00.000Z",
      "recurrence": "none",
      "recurrenceEndDateKey": null,
      "recurrenceWeekdays": null
    }
  ],
  "warnings": [
    {
      "type": "time-collision",
      "sourceClusterId": "new-cluster-id",
      "targetClusterId": "existing-cluster-id"
    }
  ]
}
```

This action should apply only to one-off clusters for the source day.

## Backend Warning Contract

Current frontend expects overlap warnings in this format:

```ts
type DuplicationWarning = {
  type: 'time-collision';
  sourceClusterId: string;
  targetClusterId: string;
};
```

At minimum, backend should be able to detect time overlaps after create/update/duplicate operations.

## Normalization Rules

Backend should normalize incoming clusters like this:

- invalid or missing `description` -> `""`
- invalid `recurrence` -> reject request or normalize to `none`
- invalid `recurrenceEndDateKey` -> reject request
- invalid `recurrenceWeekdays` -> reject request
- duration under `15m` -> reject request
- if `recurrence === 'none'`:
  - force `recurrenceEndDateKey = null`
  - remove `recurrenceWeekdays`
- if `recurrence !== 'weekly'`:
  - remove `recurrenceWeekdays`
- if `recurrence === 'weekly'` and weekdays are missing:
  - derive weekday from `startAtIso`

## Timezone Notes

The current frontend uses:

- ISO timestamps for exact instants
- `YYYY-MM-DD` date keys for local calendar navigation

Recommended backend behavior:

- persist timestamps in UTC
- return timestamps as ISO UTC strings
- persist `selectedDateKey`, `weekAnchorDateKey`, and `recurrenceEndDateKey` as date-only values

Do not replace `selectedDateKey` and `weekAnchorDateKey` with timestamps. The frontend expects date keys.

## Suggested Implementation Order

### Fastest integration

1. implement `GET/PUT/DELETE /api/time-clustering/snapshot`
2. store the snapshot per user
3. validate and normalize each cluster before save
4. connect the frontend repository to this API

### Better long-term design

1. implement `state + clusters` resources
2. add duplicate-day action
3. compute warnings on the backend
4. add frontend adapter from repository to structured API

## Recommended Backend Decision

For the current frontend, the recommended first implementation is:

- snapshot API first
- structured API later

That minimizes frontend changes while unblocking backend integration immediately.
