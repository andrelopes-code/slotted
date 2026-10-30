import {
  NexoraApiError,
  notFound,
  validationFailed,
  type CurrencyCode,
  type EntityMetadata,
  type FieldError,
  type Money,
} from '../../domain';
import type { CollectionName } from '../../data/dataset';
import type { EntityOf } from '../store';
import type { ApiRuntime, MutationOptions, Transaction } from '../runtime';

export type Aggregate = { id: string; metadata: EntityMetadata };

/** Loads an aggregate or throws 404. */
export function load<K extends CollectionName>(
  runtime: ApiRuntime,
  collection: K,
  id: string,
  label: string,
): EntityOf<K> {
  const entity = runtime.store.get(collection, id);
  if (!entity) throw notFound(label, id);
  return entity;
}

/** Snapshots, checks If-Match and returns the aggregate for mutation. */
export function open<K extends CollectionName>(
  tx: Transaction,
  collection: K,
  id: string,
  label: string,
  options: MutationOptions | undefined,
): EntityOf<K> {
  const entity = load(tx.runtime, collection, id, label);
  tx.assertVersion((entity as unknown as Aggregate).metadata, options, label);
  return tx.touch(collection, entity);
}

/** Bumps version, invalidates and writes the audit record for an aggregate mutation. */
export function finalize(
  tx: Transaction,
  collection: CollectionName,
  entity: Aggregate,
  action: string,
  entityType: string,
  changedFields?: string[],
  before?: unknown,
): void {
  const versions = tx.bump(entity.metadata, changedFields);
  tx.dirty(collection);
  tx.audit(action, entityType, entity.id, {
    previousVersion: versions.previousVersion,
    nextVersion: versions.nextVersion,
    ...(changedFields ? { changedFields } : {}),
    ...(before !== undefined ? { before, after: summarize(entity) } : {}),
  });
}

function summarize(entity: Aggregate): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (key === 'metadata') continue;
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('minor' in (value as object))
    )
      continue;
    output[key] = value;
  }
  return output;
}

export function metadata(tx: Transaction, id: string): EntityMetadata {
  return {
    id,
    organizationId: tx.runtime.store.dataset.organization.id,
    createdAt: tx.occurredAt,
    createdBy: tx.actor.id,
    updatedAt: tx.occurredAt,
    updatedBy: tx.actor.id,
    version: 1,
  };
}

export class Validator {
  readonly errors: FieldError[] = [];

  required(field: string, value: unknown, message = 'is required'): this {
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0)
    )
      this.errors.push({ field, code: 'REQUIRED', message: `${field} ${message}` });
    return this;
  }

  check(condition: boolean, field: string, code: string, message: string): this {
    if (!condition) this.errors.push({ field, code, message });
    return this;
  }

  oneOf<T extends string>(field: string, value: unknown, allowed: readonly T[]): this {
    if (value !== undefined && !allowed.includes(value as T))
      this.errors.push({
        field,
        code: 'INVALID_VALUE',
        message: `${field} must be one of ${allowed.join(', ')}`,
      });
    return this;
  }

  throwIfAny(message?: string): void {
    if (this.errors.length > 0) throw validationFailed(this.errors, message);
  }
}

export function moneyOrZero(value: Money | undefined, currency: Money['currency'] = 'USD'): Money {
  return value ?? { currency, minor: 0 };
}

export function transition(entity: string, from: string, action: string): NexoraApiError {
  return new NexoraApiError(
    'INVALID_STATE_TRANSITION',
    `${entity} in status ${from} cannot ${action}`,
    { details: { entity, from, action } },
  );
}

export function domainError(
  code: string,
  message: string,
  status = 422,
  details?: Record<string, unknown>,
): NexoraApiError {
  return new NexoraApiError(code, message, { status, ...(details ? { details } : {}) });
}

export function trimmed(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text && text.length > 0 ? text : undefined;
}

/** Human-readable USD from minor units for messages. */
/** Activity summaries use en-US formatting with the document currency; display formatting is the client's concern. */
export function dollars(value: Money | number, currency: CurrencyCode = 'USD'): string {
  const minor = typeof value === 'number' ? value : value.minor;
  const code = typeof value === 'number' ? currency : value.currency;
  return (minor / 100).toLocaleString('en-US', { style: 'currency', currency: code });
}
