export type BoardEntityId = string;
export type BoardMeta = Record<string, unknown> | null;

export interface Board {
  id: BoardEntityId;
  title: string;
  meta?: BoardMeta;
  columns: BoardColumn[];
}

export interface BoardColumn {
  id: BoardEntityId;
  title: string;
  meta?: BoardMeta;
  order: number;
  pos?: string | number | null;
  cards: Card[];
  board: Board['id'];
}

export interface CardMirrorSource {
  board_id: BoardEntityId;
  board_title: string;
  column_id: BoardEntityId;
  column_title: string;
  placement_id: BoardEntityId;
  archived: boolean;
}

export interface Card {
  id: BoardEntityId;
  placement_id?: BoardEntityId | null;
  title: string;
  description: string;
  meta?: BoardMeta;
  pos?: string | number | null;
  order?: number;
  column: BoardColumn['id'];
  tags?: Tag[];
  tag_ids?: number[];
  checklist_summary?: CardChecklistSummary | null;
  entity_links?: CardEntityLink[];
  mirror_source?: CardMirrorSource | null;
  version?: number;
  completedAt?: Date | null;
  created_at?: string;
  updated_at?: string;
}

export type CardChecklistSummary = {
  total: number;
  completed: number;
};

export type CardCheckItemState = 'complete' | 'incomplete';

export interface CardCheckItem {
  id: BoardEntityId;
  checklist: BoardEntityId;
  title: string;
  state: CardCheckItemState;
  pos?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CardChecklist {
  id: BoardEntityId;
  card: Card['id'];
  title: string;
  pos?: string | number | null;
  items: CardCheckItem[];
  created_at?: string;
  updated_at?: string;
}

export type CardEntityLinkType = 'task' | 'story' | 'goal';

export type CardEntityLinkSummary = {
  id: BoardEntityId;
  title: string;
  status?: string | null;
};

export interface CardEntityLink {
  id: BoardEntityId;
  card: Card['id'];
  entity_type: CardEntityLinkType;
  entity_id: BoardEntityId;
  entity?: CardEntityLinkSummary | null;
  created_at?: string;
}

export interface CardPlacement {
  id: BoardEntityId;
  card: Card['id'];
  column: BoardColumn['id'];
  pos?: string | number | null;
  order?: number;
  archived: boolean;
  mirror_source?: CardMirrorSource | null;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarEvent {
  // TODO: remove legacy
  id: string;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
}

export interface TaskOld {
  id: string;
  title: string;
  description: string;
  start_date?: Date;
  end_date?: Date;
  done: boolean;
}

export interface Column {
  title: string;
  date?: Date;
  events: PlatformEvent[];
  tasks: PlatformTask[];
  habits: Habit[];
  styles?: {
    title?: string;
  };
}

export interface List {
  title: string;
  items: Goal[];
}

export interface PlatformEvent {
  readonly id: number;
  title: string;
  description: string;
  start_time: Date | null;
  end_time: Date | null;
  location: string;
  status: Status;
}

export interface Goal {
  readonly id: number;
  uuid?: string;
  title: string;
  description: string | null;
  created_at: string;
  scale: number | null;
  tasks: PlatformTask[];
  stories?: Story[];
  subgoals: SubgoalSummary;
  priority: string;
  status: string;
  strategies: Strategy[];
  milestones: MilestoneSummary;
  tags: Tag[];
  tag_ids?: number[];
}

export interface SubgoalSummary {
  items: Subgoal[];
  total_count: number;
  completed_count: number;
  is_draft: boolean;
}

export interface MilestoneSummary {
  items: Milestone[];
  total_count: number;
  completed_count: number;
  is_draft: boolean;
}

export interface Subgoal {
  readonly id: number;
  parent_goal: number;
  title: string;
  description: string;
  created_at: Date;
  completed: boolean;
  tasks: TaskOld[];
  priority: Priority;
  status: Status;
  strategies: Strategy[];
  milestones: {
    items: Milestone[];
    total_count: number;
    completed_count: number;
    is_draft: boolean;
  };
}

export interface Strategy {
  readonly id: number;
  title: string;
  description: string;
  created_at: Date;
  parent_goal: Goal['id'];
  subgoals: Subgoal[];
  tasks: PlatformTask[];
  priority: Priority;
  status: Status;
  // TODO: add other fields
}

export interface Milestone {
  readonly id: number;
  title: string;
  description: string;
  created_at: Date;
  deadline: Date;
  parent_goal: Goal['id'];
  parent_subgoal: Subgoal['id'];
  status: Status;
  order: number;
}

export interface Flow {
  readonly id: number;
  title: string;
  status: Status;
  tasks: PlatformTask[];
}

export interface Story {
  readonly id: number;
  uuid?: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  goal?: Goal | null;
  goal_id?: Goal['id'] | null;
  tasks?: PlatformTask[];
}

export interface PlatformTask {
  readonly id: number;
  uuid?: string;
  title: string;
  description: string;
  created_at: Date;
  start_date: Date | null;
  due_date: Date | string | null;
  resolved_date: Date | null;
  estimate: number;
  subtasks: Subtask[];
  priority: Priority;
  status: Status;
  readonly tags: Tag[];
  tag_ids?: number[];
  challenge: Challenge['id'] | null;
  readonly goal: Goal | null;
  goal_id?: Goal['id'] | null;
  strategy: Strategy['id'] | null;
  is_completed: boolean;
  is_standalone: boolean;
  relations: Array<TaskRelationship>;
  readonly project?: Project | null;
  project_id?: number;
  stage?: number | null;
  module?: number | null;
  element?: number | null;
  readonly flows: Flow[];
  flow_ids?: number[];
  readonly story?: Story | null;
  story_id?: number | null;
}

export interface SimpleTask {
  readonly id: number;
  title: string;
}

export interface TaskRelationship {
  id: number;
  from_task: SimpleTask;
  to_task: SimpleTask;
  relationship_type: TaskRelationshipType;
}

export type GoalRelationType = 'leads_to' | 'blocks' | 'relates_to';

export interface GoalRelation {
  id: string;
  from_goal_uuid: string;
  to_goal_uuid: string;
  relation_type: GoalRelationType;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type GoalRelationCreate = Omit<
  GoalRelation,
  'id' | 'created_at' | 'updated_at'
>;

export type GoalRelationUpdate = Partial<
  Pick<
    GoalRelation,
    'from_goal_uuid' | 'to_goal_uuid' | 'relation_type' | 'meta'
  >
>;

export type CanvasRelationElementType =
  | 'task'
  | 'story'
  | 'goal'
  | 'subgoal'
  | 'routine';
export type CanvasRelationType =
  | 'parent_child'
  | 'blocks'
  | 'leads_to'
  | 'relates_to';

export interface CanvasRelation {
  id: string;
  canvas: string;
  from_type: CanvasRelationElementType;
  from_uuid: string;
  to_type: CanvasRelationElementType;
  to_uuid: string;
  relation_type: CanvasRelationType;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CanvasRelationCreate = Omit<
  CanvasRelation,
  'id' | 'created_at' | 'updated_at'
>;

export type CanvasRelationUpdate = {
  id: string;
  relation_type?: CanvasRelationType;
  meta?: Record<string, unknown> | null;
};

export interface Subtask {
  readonly id: number;
  title: string;
  is_completed: boolean;
  parent_task: number;
  estimate: number;
  created_at: Date;
  due_date: Date | null;
  resolved_date: Date | null;
  description: string;
  priority: Priority;
  status: Status;
}

export interface DraftGroup {
  id: number;
  title: string;
  created_at: Date;
  drafts: Draft[];
}

export interface Draft {
  readonly id: number;
  title: string;
  description: string;
  created_at: Date;
  priority: Priority;
  group: DraftGroup | null;
}

export interface Counter {
  readonly id: number;
  title: string;
  value: number;
  created_at: Date;
}

export interface Habit {
  readonly id: string;
  uuid: string;
  title: string;
  description: string;
  created_at: Date;
  priority: Priority;
  status: Status;
  last_checked: Date;
  meta: Record<string, unknown> | null;
  is_due_today: boolean;
  weekly_completions: DateCompletion[];
  completions: DateCompletion[];
}

export type DateCompletion = [string, boolean];

export interface HabitTrackerHabitSummary {
  readonly id: string;
  uuid: string;
  title: string;
  description: string;
  created_at: string | Date;
  priority: Priority;
  status: Status;
  last_checked: string | Date | null;
  meta: Record<string, unknown> | null;
}

export interface HabitTrackerDay {
  date: string;
  is_today: boolean;
}

export interface HabitTrackerDayState {
  date: string;
  is_due: boolean;
  is_completed: boolean;
}

export interface HabitTrackerRow {
  habit: HabitTrackerHabitSummary;
  day_states: HabitTrackerDayState[];
}

export interface HabitTrackerSummary {
  date: string;
  total: number;
  completed: number;
  open: number;
}

export interface HabitTrackerSnapshot {
  start_date: string;
  end_date: string;
  days: HabitTrackerDay[];
  active_habits: HabitTrackerRow[];
  archived_habits: HabitTrackerHabitSummary[];
  summary: {
    today: HabitTrackerSummary;
  };
}

export interface HabitDayRow {
  habit: HabitTrackerHabitSummary;
  state: HabitTrackerDayState;
}

export interface HabitDaySnapshot {
  day: HabitTrackerDay;
  active_habits: HabitDayRow[];
  archived_habits: HabitTrackerHabitSummary[];
  summary: HabitTrackerSummary;
}

export type NoteStatus = 'active' | 'archived';

export interface Note {
  readonly id: string;
  title: string;
  body: string;
  status: NoteStatus;
  is_pinned: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NoteSummary {
  total: number;
  active: number;
  archived: number;
  pinned: number;
  pinned_active: number;
}

export interface Routine {
  readonly id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  completed_dates: Date[];
}

export interface Project {
  readonly id: number;
  title: string;
  description: string | null;
  stages: Stage[];
  priority: Priority;
  status: Status;
}

export interface Stage {
  readonly id: number;
  project: number;
  title: string;
  description: string;
  modules: Module[];
  order: number;
}

export interface Module {
  readonly id: number;
  project: number;
  stage: number;
  title: string;
  description: string;
  elements: Element[];
}

export interface Element {
  readonly id: number;
  project: number;
  stage: number;
  module: number;
  title: string;
  description: string;
}

export interface Challenge {
  readonly id: number;
  title: string;
  description: string;
  created_at: Date;
  priority: Priority;
  status: Status;
  difficulty: Difficulty;
  owner: any;
  participants: Participant[];
  invitations: ChallengeInvitation[];
  tasks: {
    items: PlatformTask[];
    total_count: number;
    completed_count: number;
    are_all_draft: boolean;
  };
  tags: Tag[];
}

export interface Participant {
  readonly id: number;
  user: any;
  challenge: Challenge['id'];
  joined_at: Date;
}

export interface ChallengeInvitation {
  readonly id: number;
  challenge: number;
  token: string;
  status: ChallengeInvitationStatus;
  usage_limit: number | null;
  usage_count: number;
  expiration_time: number | null;
}

export interface Tag {
  readonly id: number;
  title: string;
  slug: string;
  color: string;
  description: string | null;
  readonly tasks?: number[];
}

export interface Wallpaper {
  readonly id: number;
  image_file: string;
}

export interface Question {
  readonly id: number;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  created_at: Date;
  updated_at: Date | null;
  due_date: Date | null;
  answers: Answer[];
}

export interface Answer {
  readonly id: number;
  question: Question['id'];
  text: string;
  created_at: Date;
}

export enum ChallengeInvitationStatus {
  Pending = 'pending',
  Active = 'active',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum Priority {
  Lowest = 'lowest',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Highest = 'highest',
}

export enum Status {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
  Described = 'described',
  Draft = 'draft',
  Cancelled = 'cancelled',
}

export enum Difficulty {
  Trivial = 'trivial',
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum TaskRelationshipType {
  Blocks = 'blocks',
  IsBlockedBy = 'is_blocked_by',
  Duplicates = 'duplicates',
  IsDuplicatedBy = 'is_duplicated_by',
  RelatesTo = 'relates_to',
}

/*
 * Type Guards
 */
export function isGoal(object: any): object is Goal {
  const candidate = object as Partial<Goal>;
  return (
    typeof object === 'object' &&
    object !== null &&
    'id' in object &&
    'title' in object &&
    'description' in object &&
    'created_at' in object &&
    'scale' in object &&
    Array.isArray(candidate.tasks) &&
    typeof candidate.subgoals === 'object' &&
    candidate.subgoals !== null &&
    'priority' in object &&
    'status' in object &&
    Array.isArray(candidate.strategies) &&
    typeof candidate.milestones === 'object' &&
    candidate.milestones !== null &&
    Array.isArray(candidate.tags)
  );
}

export function isSubgoal(object: any): object is Subgoal {
  return (
    'id' in object &&
    'title' in object &&
    'description' in object &&
    'created_at' in object &&
    'completed' in object &&
    Array.isArray(object.tasks) &&
    'priority' in object &&
    'status' in object &&
    Array.isArray(object.strategies)
  );
}

export function isStrategy(object: any): object is Strategy {
  return (
    'id' in object &&
    'title' in object &&
    'description' in object &&
    'created_at' in object &&
    'parent_goal' in object &&
    Array.isArray(object.subgoals) &&
    Array.isArray(object.tasks) &&
    'priority' in object &&
    'status' in object
  );
}

export function isChallenge(object: any): object is Challenge {
  return (
    typeof object === 'object' &&
    object !== null &&
    typeof object.id === 'number' &&
    typeof object.title === 'string' &&
    typeof object.description === 'string' &&
    typeof object.created_at === 'string' &&
    typeof object.updated_at === 'string' &&
    typeof object.priority === 'string' &&
    typeof object.status === 'string' &&
    typeof object.resource_type === 'string' &&
    Array.isArray(object.participants) &&
    typeof object.tasks === 'object'
  );
}
