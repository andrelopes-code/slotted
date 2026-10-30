import type { FormErrors } from '@slotted/core/form';

import { isApiError } from '../backend/api-error';

/**
 * A refusal classed by what the reader does next (ER-01): a conflict is read
 * again, a transport failure is tried again, a permission is someone else's,
 * a state is the record not allowing it now, and a validation is a field to
 * correct.
 */
export type FailureKind = 'conflict' | 'transport' | 'permission' | 'state' | 'validation' | 'unknown';

export interface InventoryFailure {
  readonly code: string;
  readonly message: string;
  readonly kind: FailureKind;
}

/** §78.2's conflicts the inventory commands and a count's approval can meet: the record moved under the reader. */
export const INVENTORY_CONFLICTS: ReadonlySet<string> = new Set([
  'STALE_VERSION',
  'INVENTORY_CHANGED',
  'APPROVAL_ALREADY_DECIDED',
]);

export function classify(
  error: unknown,
  words: Readonly<Record<string, string>>,
  fallback: string,
): InventoryFailure {
  if (!isApiError(error)) return { code: 'UNKNOWN', message: fallback, kind: 'unknown' };
  const kind: FailureKind = INVENTORY_CONFLICTS.has(error.code)
    ? 'conflict'
    : error.code === 'SERVICE_UNAVAILABLE'
      ? 'transport'
      : error.code === 'FORBIDDEN'
        ? 'permission'
        : error.code === 'VALIDATION_FAILED'
          ? 'validation'
          : 'state';
  return { code: error.code, message: words[error.code] ?? error.message, kind };
}

/** The backend's field errors as the form's error map, keyed by the backend's own names (FM-02). */
export function fieldErrors(error: unknown): FormErrors {
  if (!isApiError(error)) return {};
  const map: Record<string, string[]> = {};
  for (const field of error.fieldErrors ?? [])
    map[field.field] = [...(map[field.field] ?? []), field.message];
  return map;
}

/** What the reader does next about the class of refusal they met (ER-04). */
export function adviceFor(kind: FailureKind): string {
  switch (kind) {
    case 'conflict':
      return 'The page has been read again: what you see below is what Nexora holds now.';
    case 'transport':
      return 'Nothing was changed. Try the same action again in a moment.';
    case 'permission':
      return 'Your role does not hold this command in this warehouse.';
    case 'validation':
      return 'Correct the fields marked below and try again.';
    default:
      return 'Nothing was changed.';
  }
}

/** A conflict is a warning that the page was read again; a transport failure is a danger (ER-04). */
export function toneFor(kind: FailureKind): 'danger' | 'warning' {
  return kind === 'transport' || kind === 'unknown' ? 'danger' : 'warning';
}

/**
 * The map without the keys of a control that was just edited. A line's
 * number field carries no name of its own (`number-field` reads `name` as a
 * static attribute, and a row in a loop has none to write), so the form cannot
 * drop the line's message on its own the way it drops a named control's.
 */
export function without(errors: FormErrors, ...keys: string[]): FormErrors {
  if (!keys.some((key) => key in errors)) return errors;
  const next: Record<string, readonly string[]> = { ...errors };
  for (const key of keys) delete next[key];
  return next;
}
