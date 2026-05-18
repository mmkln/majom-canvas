# Flow Focus Contract

## Purpose

`Flow` is a process. `FlowFocus` is the active slice of that process.

The Flows page should show one current focus for each flow line. Focus is not UI metadata and must not be stored under `Flow.meta`. It is a domain entity with lifecycle rules, history, validation, and backend constraints.

## Ownership

- Backend owner: `platform-django/platformapp`
- Frontend API boundary: `src/majom-wrapper/data-access/flows-api-service.ts`
- Frontend domain/view owner: `src/features/flows`
- Existing `focus_board` is unrelated. It stores a per-user day/cycle snapshot with `focusTaskUuid`; it is not the Flow Focus entity.

## Identity

Current backend `Flow.id` is an integer. The focus contract uses UUID strings for public focus ids and flow ids.

Required compatibility path:

1. Add `uuid` to backend `Flow` and expose it in `FlowSerializer`.
2. Keep current integer `Flow.id` in API responses during migration.
3. Use `Flow.uuid` as the public `flowId` in `FlowFocusDTO`.
4. Keep existing `/flows/:id/` routes accepting the current integer id until a separate route migration is planned.

## Domain Enums

Backend should define dedicated `models.TextChoices`; frontend should define dedicated TypeScript enums. Do not reuse the global task/flow `Status`, because Focus has `candidate`, `paused`, and `failed`.

```ts
export enum FocusType {
  Mission = 'mission',
  Objective = 'objective',
  Cycle = 'cycle',
  Stage = 'stage',
  Milestone = 'milestone',
  Experiment = 'experiment',
  Maintenance = 'maintenance',
}

export enum FocusStatus {
  Draft = 'draft',
  Candidate = 'candidate',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
  Archived = 'archived',
}
```

## Focus Semantics

- `mission`: complete a concrete piece of work or artifact.
- `objective`: reach a target state.
- `cycle`: repeat an operating loop.
- `stage`: pass a development level.
- `milestone`: close a checkpoint.
- `experiment`: test an unknown.
- `maintenance`: keep the system or line operational.

## API DTO

Use camelCase for new Focus DTO fields. Existing legacy Flow/Task fields may remain as-is until separately migrated.

```ts
export type FlowFocusDTO = {
  id: string;
  flowId: string;
  type: FocusType;
  title: string;
  description: string;
  status: FocusStatus;
  startDate: string | null;
  endDate: string | null;
  successCriteria: string;
  evidenceRequired: string | null;
  evidence: string | null;
  closeReason: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FlowDTO = {
  id: number;
  uuid: string;
  title: string;
  status: Status;
  meta?: FlowMeta;
  tasks: PlatformTask[];
  currentFocus: FlowFocusDTO | null;
};
```

`currentFocus` means the flow's primary active focus. If there is no primary active focus, it is `null`.

## Backend Model Contract

Recommended model name: `FlowFocus`.

Internal fields:

- `id`: `UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`
- `flow`: `ForeignKey(Flow, related_name='focuses', on_delete=CASCADE)`
- `owner`: `ForeignKey(settings.AUTH_USER_MODEL, related_name='flow_focuses', on_delete=CASCADE)`
- `type`: `CharField(choices=FlowFocusType.choices)`
- `title`: required `CharField`
- `description`: `TextField(blank=True, default='')`
- `status`: `CharField(choices=FlowFocusStatus.choices, default=Draft)`
- `start_date`: nullable date
- `end_date`: nullable date
- `success_criteria`: required `TextField`
- `evidence_required`: optional `TextField`
- `evidence`: optional `TextField`
- `close_reason`: optional `TextField`
- `is_primary`: `BooleanField(default=True)`
- `created_at`, `updated_at`

Backend should set `owner` from `request.user`; clients must not be allowed to set another owner.

## Backend Constraints And Validation

Rule 1: one primary active focus per flow.

Use a partial unique constraint:

```py
models.UniqueConstraint(
    fields=['flow'],
    condition=Q(status='active', is_primary=True),
    name='unique_primary_active_focus_per_flow',
)
```

Rule 2: completed focus requires evidence or explicit close reason.

Use serializer/model validation; add a DB check constraint if the database supports the required expression reliably.

Validation rule:

- If `status == completed`, then `evidence` or `close_reason` must be non-empty.
- If `end_date < start_date`, reject.
- If activating a focus from another user's flow, reject through queryset ownership.
- If activating a focus while another primary active focus exists, return `409 active_focus_exists` unless the activation request explicitly asks to replace it.

`evidenceRequired` is a requirement description, not the actual proof. It cannot satisfy Rule 2 by itself.

## API Endpoints

Add focus endpoints under the Flow API.

### List Focuses

`GET /flows/{flowId}/focuses/`

`flowId` may initially be the legacy integer Flow id for route compatibility. Response DTO still returns UUID `flowId`.

Query params:

- `status`
- `type`
- `includeArchived=false`

Response:

```ts
FlowFocusDTO[]
```

### Create Focus

`POST /flows/{flowId}/focuses/`

Payload:

```ts
type FlowFocusCreatePayload = {
  type: FocusType;
  title: string;
  description?: string;
  status?: FocusStatus.Draft | FocusStatus.Candidate;
  startDate?: string | null;
  endDate?: string | null;
  successCriteria: string;
  evidenceRequired?: string | null;
  isPrimary?: boolean;
};
```

Creating an `active` focus directly should be rejected. Activation should go through the activate endpoint.

### Patch Focus

`PATCH /flow-focuses/{focusId}/`

Payload:

```ts
type FlowFocusPatchPayload = Partial<{
  type: FocusType;
  title: string;
  description: string;
  status: FocusStatus;
  startDate: string | null;
  endDate: string | null;
  successCriteria: string;
  evidenceRequired: string | null;
  evidence: string | null;
  closeReason: string | null;
  isPrimary: boolean;
}>;
```

Patching `status` to `completed` must enforce Rule 2. Patching `status` to `active` should be rejected; activation must go through the activate endpoint so Rule 1 is enforced in one transactional path.

### Activate Focus

`POST /flow-focuses/{focusId}/activate/`

Payload:

```ts
type FlowFocusActivatePayload = {
  replaceActive?: boolean;
  startDate?: string | null;
};
```

Behavior:

- If another primary active focus exists and `replaceActive !== true`, return `409 active_focus_exists`.
- If `replaceActive === true`, pause the previous primary active focus in the same transaction, then activate this focus.
- Response returns the activated `FlowFocusDTO`.

### Complete Focus

`POST /flow-focuses/{focusId}/complete/`

Payload:

```ts
type FlowFocusCompletePayload = {
  evidence?: string | null;
  closeReason?: string | null;
  endDate?: string | null;
};
```

Behavior:

- Reject if both `evidence` and `closeReason` are blank.
- Set `status=completed`.
- Set `endDate` to payload value or today on backend.
- Response returns completed `FlowFocusDTO`.

## Flow List Contract

`GET /flows/` should include `currentFocus` for each flow row.

The Flows page must not need a second request per flow just to render the current focus card. Focus history can be lazy-loaded from `/flows/{flowId}/focuses/`.

## Frontend State Contract

`FlowsStore` remains the single owner of Flow page data and request lifecycle.

Recommended additions:

- `Flow.currentFocus: FlowFocus | null`
- `FlowsApiService.getFlowFocuses(flowId)`
- `FlowsApiService.createFlowFocus(flowId, payload)`
- `FlowsApiService.patchFlowFocus(focusId, payload)`
- `FlowsApiService.activateFlowFocus(focusId, payload)`
- `FlowsApiService.completeFlowFocus(focusId, payload)`

`FlowsStore` methods:

- `createFlowFocus(flowId, payload)`
- `patchFlowFocus(focusId, payload)`
- `activateFlowFocus(flowId, focusId, payload)`
- `completeFlowFocus(flowId, focusId, payload)`

Store update rules:

- Updating the current focus should patch only the owning `FlowColumn`.
- Activating a focus should update `flow.currentFocus` for that flow.
- Completing the current focus should set `flow.currentFocus` to `null` unless backend returns a replacement active focus.
- Focus history should be loaded lazily and should not block initial `/flows/` rendering.

## UI Contract

Initial Flows UI should render current focus inside each flow column header area or directly below it, using the existing section-keyed `FlowColumnView` boundary.

Expected controls:

- If no current focus: `+ Add Focus`
- If current focus exists: type badge, title, status, success criteria summary
- Actions: edit, activate, complete, archive

Do not make Focus part of task cards. Focus is the line's active slice, not a task.

## Backend Test Checklist

- Creating a focus assigns owner from request user.
- Users cannot list or mutate focuses for another user's flow.
- `/flows/` includes `uuid` and `currentFocus`.
- Creating focus under `/flows/{id}/focuses/` binds it to that flow.
- Direct active create is rejected.
- Activating focus succeeds when no active primary focus exists.
- Activating second focus without `replaceActive` returns `409 active_focus_exists`.
- Activating second focus with `replaceActive=true` pauses the previous active focus.
- Completing without evidence and without close reason is rejected.
- Completing with evidence succeeds.
- Completing with close reason succeeds.

## Frontend Test Checklist

- API service calls all focus endpoints with expected payloads.
- `FlowsStore` stores `currentFocus` from `/flows/`.
- Creating a focus updates only the owning flow column.
- Activating a focus updates `currentFocus`.
- Completing current focus clears or replaces `currentFocus` according to backend response.
- `FlowColumnView` section keys include focus header/card data so task updates do not replace focus UI.

## Implementation Order

1. Backend: add `Flow.uuid`.
2. Backend: add `FlowFocus` model, migration, serializer, viewset/actions, tests.
3. Backend: include `currentFocus` in `FlowSerializer`.
4. Frontend: add `FlowFocus`, `FocusType`, `FocusStatus` contracts.
5. Frontend: add API service focus methods and tests.
6. Frontend: extend `FlowsStore` focus mutations and tests.
7. Frontend: render current focus read-only in flow columns.
8. Frontend: add create/edit/activate/complete UI flows.
