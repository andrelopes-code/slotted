import type { EntityMetadata } from './common';

export interface ActivityEvent {
  id: string;
  organizationId: string;
  type: string;
  actorId: string;
  occurredAt: string;
  subjectType: string;
  subjectId: string;
  /** Human-readable subject reference (business number or name). */
  subjectLabel?: string;
  customerId?: string;
  orderId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  occurredAt: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousVersion?: number;
  nextVersion?: number;
  changedFields?: string[];
  before?: unknown;
  after?: unknown;
  correlationId: string;
  /** Written by a workflow run's action: the workflow and the run (section 69.3). */
  workflowId?: string;
  workflowRunId?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'action_required';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  archivedAt?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  assigneeId: string;
  createdBy: string;
  dueDate?: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'completed' | 'cancelled';
  relatedEntityType?: string;
  relatedEntityId?: string;
  completedAt?: string;
  createdAt: string;
}

export type SavedViewResource =
  | 'customers'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'purchase_orders'
  | 'invoices'
  | 'tickets'
  | 'audit';

export interface FilterExpression {
  field: string;
  operator: 'eq' | 'in' | 'gte' | 'lte' | 'contains';
  value: unknown;
}

export interface SortExpression {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SavedView {
  id: string;
  organizationId: string;
  userId: string;
  resource: SavedViewResource;
  name: string;
  isDefault: boolean;
  state: {
    filters: FilterExpression[];
    sort: SortExpression[];
    visibleColumns: string[];
    columnOrder: string[];
    grouping?: string[];
    density?: 'comfortable' | 'compact';
    pageSize?: 25 | 50 | 100;
  };
  metadata: EntityMetadata;
}

export type ImportJobStatus =
  | 'created'
  | 'mapping'
  | 'validating'
  | 'ready'
  | 'importing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled';

export interface ImportJobIssue {
  row: number;
  field?: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface ImportJob {
  id: string;
  organizationId: string;
  type: 'customers';
  fileName: string;
  status: ImportJobStatus;
  createdBy: string;
  columns: string[];
  mapping: Record<string, string>;
  sampleRows: string[][];
  issues: ImportJobIssue[];
  result?: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    importedRows: number;
    skippedRows: number;
  };
  metadata: EntityMetadata;
}
