import {
  AUTOMATION_ACTOR_ID,
  AUTOMATION_PERMISSIONS,
  NexoraApiError,
  forbidden,
  isPermission,
  preconditionRequired,
  staleVersion,
  type ActivityEvent,
  type AuditEvent,
  type EntityMetadata,
  type Notification,
  type Permission,
  type PermissionScope,
  type User,
  type WorkflowTriggerType,
} from '../domain';
import type { CollectionName } from '../data/dataset';
import { createIndexes, type Indexes } from './indexes';
import { Projections } from './projections';
import type { EntityOf, Store } from './store';

export type LatencyProfile = 'none' | 'normal' | 'degraded';
export type RequestKind = 'read' | 'write' | 'search' | 'analytics';

export interface RuntimeOptions {
  latency?: LatencyProfile;
  /** Deterministic jitter seed (screenshot/test mode, section 78.1). */
  latencySeed?: string;
}

export interface ResourceScope {
  ownerId?: string;
  teamId?: string;
  warehouseId?: string;
  customerId?: string;
}

export interface EffectivePermission {
  permission: Permission;
  scopes: PermissionScope[];
}

/** Section 55 — permission and scope evaluation for the signed-in user. */
export class Authorization {
  private readonly cache = new Map<string, Map<string, PermissionScope[]>>();

  constructor(
    private readonly store: Store,
    private readonly indexes: Indexes,
  ) {
    store.subscribe((collection) => {
      if (collection === 'roleAssignments' || collection === 'roles') this.cache.clear();
    });
  }

  effectivePermissions(userId: string): Map<string, PermissionScope[]> {
    const cached = this.cache.get(userId);
    if (cached) return cached;
    const result = new Map<string, PermissionScope[]>();
    if (userId === AUTOMATION_ACTOR_ID)
      for (const permission of AUTOMATION_PERMISSIONS) result.set(permission, [{ type: 'all' }]);
    for (const assignment of this.indexes.roleAssignmentsByUser.get(userId)) {
      const role = this.store.dataset.roles.get(assignment.roleId);
      if (!role) continue;
      for (const grant of role.grants) {
        const scope: PermissionScope =
          assignment.scope.type === 'all' || grant.defaultScope === 'all'
            ? { type: 'all' }
            : assignment.scope;
        const bucket = result.get(grant.permission) ?? [];
        bucket.push(scope);
        result.set(grant.permission, bucket);
      }
    }
    this.cache.set(userId, result);
    return result;
  }

  can(user: User, permission: Permission, resource?: ResourceScope): boolean {
    const scopes = this.effectivePermissions(user.id).get(permission);
    if (!scopes || scopes.length === 0) return false;
    if (!resource) return true;
    return scopes.some((scope) => this.scopeMatches(scope, user, resource));
  }

  private scopeMatches(scope: PermissionScope, user: User, resource: ResourceScope): boolean {
    switch (scope.type) {
      case 'all':
        return true;
      case 'own':
        if (resource.ownerId !== undefined) return resource.ownerId === user.id;
        if (resource.customerId !== undefined)
          return this.store.dataset.customers.get(resource.customerId)?.accountOwnerId === user.id;
        return resource.teamId === undefined && resource.warehouseId === undefined;
      case 'team':
        if (resource.teamId !== undefined) return scope.teamIds.includes(resource.teamId);
        if (resource.customerId !== undefined) {
          const teamId = this.store.dataset.customers.get(resource.customerId)?.salesTeamId;
          return teamId !== undefined && scope.teamIds.includes(teamId);
        }
        return resource.ownerId === user.id;
      case 'warehouse':
        if (resource.warehouseId !== undefined)
          return scope.warehouseIds.includes(resource.warehouseId);
        return false;
    }
  }

  require(user: User, permission: Permission, resource?: ResourceScope): void {
    if (!this.can(user, permission, resource)) throw forbidden(permission);
  }

  hasRole(userId: string, roleKey: string): boolean {
    for (const assignment of this.indexes.roleAssignmentsByUser.get(userId)) {
      const role = this.store.dataset.roles.get(assignment.roleId);
      if (role && role.name.toLowerCase().replace(/ /g, '_') === roleKey) return true;
    }
    return false;
  }

  warehouseIdsFor(userId: string): string[] | 'all' {
    const ids = new Set<string>();
    let all = false;
    for (const assignment of this.indexes.roleAssignmentsByUser.get(userId)) {
      if (assignment.scope.type === 'warehouse')
        for (const id of assignment.scope.warehouseIds) ids.add(id);
      else all = true;
    }
    return all ? 'all' : [...ids];
  }
}

function hashFingerprint(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

const REPORT_ENDPOINTS = new Set(
  ['executive', 'sales', 'inventory', 'procurement', 'finance', 'support'].map(
    (report) => `GET /analytics/${report}`,
  ),
);

/** Section 78 — latency and failure profiles. */
export class Latency {
  profile: LatencyProfile;
  private counter = 0;

  constructor(
    profile: LatencyProfile,
    private readonly seed: string,
  ) {
    this.profile = profile;
  }

  delayFor(kind: RequestKind, fingerprint: string): number {
    if (this.profile === 'none') return 0;
    this.counter += 1;
    const jitter = hashFingerprint(`${this.seed}:${fingerprint}:${this.counter}`);
    if (this.profile === 'degraded') return 700 + Math.round(jitter * 900);
    switch (kind) {
      case 'read':
        return 120 + Math.round(jitter * 330);
      case 'write':
        return 180 + Math.round(jitter * 470);
      case 'search':
        return 180 + Math.round(jitter * 320);
      case 'analytics':
        return 300 + Math.round(jitter * 600);
    }
  }

  /** Section 77.10 — random retryable failures in the degraded profile. */
  shouldFail(endpoint: string, kind: RequestKind, fingerprint: string): boolean {
    if (this.profile !== 'degraded') return false;
    const roll = hashFingerprint(`fail:${this.seed}:${fingerprint}:${this.counter}`);
    if (endpoint === 'GET /finance/overview') return roll < 0.35;
    // The section 16 reports are analytics reads like the finance overview, and fail as it does.
    if (REPORT_ENDPOINTS.has(endpoint)) return roll < 0.35;
    if (endpoint === 'GET /activity') return roll < 0.15;
    if (kind === 'write') return roll < 0.05;
    return false;
  }
}

export interface IdempotencyRecord {
  key: string;
  fingerprint: string;
  result: unknown;
  createdAt: string;
}

export interface MutationOptions {
  /** Last observed version (If-Match). Required for aggregate mutations. */
  ifMatch?: number;
  idempotencyKey?: string;
  /** Free-form reason or comment captured by the command. */
  reason?: string;
}

interface Snapshot {
  collection: CollectionName;
  id: string;
  before: unknown | undefined;
}

/** The records an event names; the automation engine reads its subject from them. */
export interface WorkflowEventRefs {
  orderId?: string;
  customerId?: string;
  invoiceId?: string;
  ticketId?: string;
  skuId?: string;
  warehouseId?: string;
  /** `order.value_changed`: the order's total before the change, in US-dollar minor units. */
  previousTotalUsd?: number;
  /** `customer.status_changed`: the status before the change. */
  previousStatus?: string;
}

/** One event of section 69.1, queued by the command that produced it. */
export interface WorkflowEvent {
  /** With the workflow id, the run's idempotency key (section 69.4). */
  id: string;
  type: WorkflowTriggerType;
  refs: WorkflowEventRefs;
  /** The chain depth of the runs this event starts: 1 for a person's command. */
  depth: number;
  causedBy: string;
  parentRunId?: string;
  /** A scheduled event runs one workflow, the one whose schedule fell due. */
  workflowId?: string;
  /** A scheduled event: the occurrence it stands for, and how many it collapses. */
  schedule?: { date: string; weekday: string; hour: number; occurrences: number };
}

/** The run an automation action is written under, for its activity and its chained events. */
export interface AutomationContext {
  workflowId: string;
  workflowName: string;
  runId: string;
  depth: number;
}

/**
 * Atomic command scope (section 74.3). Entities touched through the
 * transaction are snapshotted; a thrown error restores every snapshot.
 * A savepoint restores only what was touched after it: an automation action
 * that fails takes back its own writes and leaves the command's.
 */
export class Transaction {
  private snapshots: Snapshot[] = [];
  private readonly touched = new Set<string>();
  readonly correlationId: string;
  readonly occurredAt: string;
  private readonly activity: ActivityEvent[] = [];
  private current: User;
  /** The person whose command opened the transaction, whoever acts inside it. */
  readonly origin: User;
  /** Section 69.1 events the command produced, in order; the engine drains them. */
  readonly events: WorkflowEvent[] = [];
  private eventCount = 0;
  private automation: AutomationContext | null = null;
  /** sku:warehouse → whether the position was below its reorder point before the command touched it. */
  private readonly positions = new Map<string, boolean>();

  constructor(
    readonly runtime: ApiRuntime,
    actor: User,
    correlationId: string,
  ) {
    this.current = actor;
    this.origin = actor;
    this.correlationId = correlationId;
    this.occurredAt = runtime.store.now;
    /* The historical summaries read the live customers and catalog: they are
       taken before the first write, so a mutation never rewrites the past. */
    void runtime.store.history.summaries;
  }

  /** Who acts: the signed-in person, or the automation actor while a workflow's actions run. */
  get actor(): User {
    return this.current;
  }

  get automationContext(): AutomationContext | null {
    return this.automation;
  }

  /** Runs `work` as another actor under a workflow run: audit, activity and versions name that actor. */
  runAs<T>(actor: User, context: AutomationContext, work: () => T): T {
    const previous = { actor: this.current, automation: this.automation };
    this.current = actor;
    this.automation = context;
    try {
      return work();
    } finally {
      this.current = previous.actor;
      this.automation = previous.automation;
    }
  }

  /** Authorizes the acting actor, who inside a workflow run is the automation actor (section 69.3). */
  require(permission: Permission, resource?: ResourceScope): User {
    this.runtime.authorization.require(this.current, permission, resource);
    return this.current;
  }

  /** Queues a section 69.1 event; inside a run it is one link further down the chain. */
  emit(type: WorkflowTriggerType, refs: WorkflowEventRefs): void {
    this.eventCount += 1;
    this.events.push({
      id: `evt_${this.correlationId}_${this.eventCount}`,
      type,
      refs,
      depth: (this.automation?.depth ?? 0) + 1,
      causedBy: this.origin.id,
      ...(this.automation ? { parentRunId: this.automation.runId } : {}),
    });
  }

  /** Queues an event the engine built itself: a schedule or a clock-derived state. */
  enqueue(event: WorkflowEvent): void {
    this.events.push(event);
  }

  /** The positions the command moved, each with whether it stood below its reorder point before. */
  movedPositions(): ReadonlyMap<string, boolean> {
    return this.positions;
  }

  private notePosition(collection: CollectionName, entity: unknown): void {
    if (collection !== 'reservations' && collection !== 'stockMovements') return;
    const record = entity as { skuId?: string; warehouseId?: string };
    if (!record.skuId || !record.warehouseId) return;
    const key = `${record.skuId}:${record.warehouseId}`;
    if (this.positions.has(key)) return;
    this.positions.set(
      key,
      this.runtime.projections.inventoryAt(record.skuId, record.warehouseId).belowReorderPoint,
    );
  }

  /** Snapshots an existing entity before mutation and returns it. */
  touch<K extends CollectionName>(collection: K, entity: EntityOf<K>): EntityOf<K> {
    const id = (entity as { id: string }).id;
    const key = `${collection}:${id}`;
    this.notePosition(collection, entity);
    if (!this.touched.has(key)) {
      this.touched.add(key);
      this.snapshots.push({ collection, id, before: structuredClone(entity) });
    }
    return entity;
  }

  /** Marks a collection dirty after in-place edits; pass the entity so key-based caches refresh one entry. */
  dirty(collection: CollectionName, entity?: { id: string }): void {
    this.runtime.store.invalidate(collection, entity);
  }

  create<K extends CollectionName>(collection: K, entity: EntityOf<K>): EntityOf<K> {
    const id = (entity as { id: string }).id;
    const key = `${collection}:${id}`;
    this.notePosition(collection, entity);
    if (!this.touched.has(key)) {
      this.touched.add(key);
      this.snapshots.push({ collection, id, before: undefined });
    }
    this.runtime.store.put(collection, entity);
    return entity;
  }

  remove(collection: CollectionName, id: string): void {
    const existing = (this.runtime.store.dataset[collection] as Map<string, unknown>).get(id);
    const key = `${collection}:${id}`;
    if (!this.touched.has(key)) {
      this.touched.add(key);
      this.snapshots.push({
        collection,
        id,
        before: existing === undefined ? undefined : structuredClone(existing),
      });
    }
    this.runtime.store.delete(collection, id);
  }

  /**
   * A point the transaction can be taken back to. Every entity is snapshotted
   * again on its first touch after it, so a rollback to it restores the state
   * the savepoint saw, including entities the command had already changed.
   */
  savepoint(): number {
    this.touched.clear();
    return this.snapshots.length;
  }

  /** Restores every entity touched since `mark`, newest first, and forgets those snapshots. */
  rollbackTo(mark: number): void {
    const undone = this.snapshots.slice(mark);
    this.restore(undone);
    this.snapshots = this.snapshots.slice(0, mark);
    this.touched.clear();
  }

  /** Bumps version/updatedAt on an aggregate after a successful mutation. */
  bump(
    metadata: EntityMetadata,
    changedFields?: string[],
  ): { previousVersion: number; nextVersion: number; changedFields: string[] | undefined } {
    const previousVersion = metadata.version;
    metadata.version += 1;
    metadata.updatedAt = this.occurredAt;
    metadata.updatedBy = this.actor.id;
    return { previousVersion, nextVersion: metadata.version, changedFields };
  }

  /** Section 53.11 — validates the client's last observed version. */
  assertVersion(
    metadata: EntityMetadata,
    options: MutationOptions | undefined,
    entityLabel: string,
  ): void {
    if (options?.ifMatch === undefined) throw preconditionRequired(entityLabel);
    if (options.ifMatch !== metadata.version)
      throw staleVersion(entityLabel, options.ifMatch, metadata.version);
  }

  /** Section 70.2 — written through the transaction, so a command that fails leaves no audit behind. */
  audit(
    action: string,
    entityType: string,
    entityId: string,
    detail: {
      previousVersion?: number;
      nextVersion?: number;
      changedFields?: string[];
      before?: unknown;
      after?: unknown;
    } = {},
  ): void {
    const record: AuditEvent = {
      id: this.runtime.store.nextId('auditEvent'),
      organizationId: this.runtime.store.dataset.organization.id,
      occurredAt: this.occurredAt,
      actorId: this.actor.id,
      action,
      entityType,
      entityId,
      correlationId: this.correlationId,
      ...(detail.previousVersion !== undefined ? { previousVersion: detail.previousVersion } : {}),
      ...(detail.nextVersion !== undefined ? { nextVersion: detail.nextVersion } : {}),
      ...(detail.changedFields ? { changedFields: detail.changedFields } : {}),
      ...(detail.before !== undefined ? { before: detail.before } : {}),
      ...(detail.after !== undefined ? { after: detail.after } : {}),
      ...(this.automation
        ? { workflowId: this.automation.workflowId, workflowRunId: this.automation.runId }
        : {}),
    };
    this.create('auditEvents', record);
  }

  activityEvent(event: {
    type: string;
    subjectType: string;
    subjectId: string;
    summary: string;
    subjectLabel?: string | undefined;
    customerId?: string | undefined;
    orderId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    actorId?: string | undefined;
    occurredAt?: string | undefined;
  }): ActivityEvent {
    // An action a workflow ran says which workflow and which run, beside the automation actor.
    const metadata = this.automation
      ? {
          ...(event.metadata ?? {}),
          workflowId: this.automation.workflowId,
          workflowName: this.automation.workflowName,
          workflowRunId: this.automation.runId,
        }
      : event.metadata;
    const record: ActivityEvent = {
      id: this.runtime.store.nextId('activityEvent'),
      organizationId: this.runtime.store.dataset.organization.id,
      actorId: event.actorId ?? this.actor.id,
      occurredAt: event.occurredAt ?? this.occurredAt,
      type: event.type,
      subjectType: event.subjectType,
      subjectId: event.subjectId,
      summary: event.summary,
      ...(event.subjectLabel ? { subjectLabel: event.subjectLabel } : {}),
      ...(event.customerId ? { customerId: event.customerId } : {}),
      ...(event.orderId ? { orderId: event.orderId } : {}),
      ...(metadata ? { metadata } : {}),
    };
    this.create('activityEvents', record);
    this.activity.push(record);
    return record;
  }

  notify(
    userId: string,
    type: Notification['type'],
    title: string,
    body: string,
    entity?: { type: string; id: string },
  ): Notification {
    const notification: Notification = {
      id: this.runtime.store.nextId('notification'),
      organizationId: this.runtime.store.dataset.organization.id,
      userId,
      type,
      title,
      body,
      createdAt: this.occurredAt,
      ...(entity ? { entityType: entity.type, entityId: entity.id } : {}),
    };
    this.create('notifications', notification);
    return notification;
  }

  rollback(): void {
    this.restore(this.snapshots);
  }

  private restore(snapshots: readonly Snapshot[]): void {
    const store = this.runtime.store;
    store.batch(() => {
      for (const snapshot of [...snapshots].reverse()) {
        const map = store.dataset[snapshot.collection] as Map<string, unknown>;
        if (snapshot.before === undefined) map.delete(snapshot.id);
        else map.set(snapshot.id, snapshot.before);
        store.invalidate(snapshot.collection);
      }
    });
  }
}

let correlationCounter = 0;

/** Shared state behind every API namespace. */
export class ApiRuntime {
  readonly indexes: Indexes;
  readonly projections: Projections;
  readonly authorization: Authorization;
  readonly latency: Latency;
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly conflictFixturesFired = new Set<string>();
  /**
   * Section 69.1: runs the workflows the command's events trigger, inside the
   * command's transaction, after its own work. The automation engine sets it.
   */
  afterCommand: ((tx: Transaction) => void) | undefined;

  constructor(
    readonly store: Store,
    options: RuntimeOptions = {},
  ) {
    this.indexes = createIndexes(store);
    this.projections = new Projections(store, this.indexes);
    this.authorization = new Authorization(store, this.indexes);
    this.latency = new Latency(options.latency ?? 'none', options.latencySeed ?? 'nexora-latency');
  }

  get actor(): User {
    const user = this.store.dataset.users.get(this.store.metadata.activePersonaId);
    if (!user) throw new NexoraApiError('UNAUTHENTICATED', 'No active persona');
    return user;
  }

  correlationId(): string {
    correlationCounter += 1;
    return `req_${Date.now().toString(36)}${correlationCounter.toString(36)}`;
  }

  /** Wraps a request with authentication, latency, degraded failures and correlation ids. */
  async request<T>(endpoint: string, kind: RequestKind, work: () => T | Promise<T>): Promise<T> {
    const correlationId = this.correlationId();
    const delay = this.latency.delayFor(kind, endpoint);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    if (this.latency.shouldFail(endpoint, kind, correlationId)) {
      throw new NexoraApiError(
        'SERVICE_UNAVAILABLE',
        'The service is temporarily unavailable. Retry the request.',
        { retryable: true, correlationId },
      );
    }
    try {
      if (!this.store.dataset.users.has(this.store.metadata.activePersonaId))
        throw new NexoraApiError('UNAUTHENTICATED', 'No active persona');
      return await work();
    } catch (error) {
      if (error instanceof NexoraApiError) throw error.withCorrelationId(correlationId);
      throw new NexoraApiError(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : String(error),
        { correlationId },
      );
    }
  }

  require(permission: string, resource?: ResourceScope): User {
    const user = this.actor;
    if (!isPermission(permission))
      throw new NexoraApiError('INTERNAL_ERROR', `Unknown permission ${permission}`);
    this.authorization.require(user, permission, resource);
    return user;
  }

  can(permission: string, resource?: ResourceScope): boolean {
    return isPermission(permission) && this.authorization.can(this.actor, permission, resource);
  }

  /**
   * Runs a command atomically (section 74.3) with idempotency (section 73.9).
   * The work receives a transaction; errors roll every touched entity back.
   */
  async command<T>(
    endpoint: string,
    options: MutationOptions | undefined,
    payloadFingerprint: unknown,
    work: (tx: Transaction) => T,
  ): Promise<T> {
    return this.request(endpoint, 'write', () => {
      const fingerprint = JSON.stringify(payloadFingerprint ?? null);
      if (options?.idempotencyKey) {
        const existing = this.idempotency.get(options.idempotencyKey);
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw new NexoraApiError(
              'IDEMPOTENCY_KEY_REUSED',
              'The idempotency key was already used with a different payload',
            );
          return existing.result as T;
        }
      }
      const tx = new Transaction(this, this.actor, this.correlationId());
      let result: T;
      try {
        result = this.store.batch(() => {
          const value = work(tx);
          this.afterCommand?.(tx);
          return value;
        });
      } catch (error) {
        tx.rollback();
        throw error;
      }
      if (options?.idempotencyKey) {
        this.idempotency.set(options.idempotencyKey, {
          key: options.idempotencyKey,
          fingerprint,
          result: structuredClone(result),
          createdAt: this.store.now,
        });
      }
      return result;
    });
  }

  /** Section 78.2 — first-attempt-only deterministic conflict for curated fixtures. */
  fireConflictOnce(key: string): boolean {
    if (this.conflictFixturesFired.has(key)) return false;
    this.conflictFixturesFired.add(key);
    return true;
  }

  clearTransientState(): void {
    this.idempotency.clear();
    this.conflictFixturesFired.clear();
  }
}
