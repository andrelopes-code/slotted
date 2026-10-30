import type { FilterCondition, FilterDescriptor, FilterGroup, FilterKind, FilterRule } from '@slotted/core/filter';
import type { FilterClause, FilterValue } from '@slotted/demo-nexora-backend';

/**
 * A door's condition written into the address of the list it opens (OV-01), so
 * the link is one a colleague can paste and the list reads it back as its own
 * bar's pills. One parameter per field, named as the backend names the field:
 *
 * - `a..b` — between two values, inclusive; `a..` and `..b` leave one end open;
 * - `>a` — greater than;
 * - `a,b` — any of the values; `!a,b` — none of them;
 * - `*` — has a value; `-` — has none;
 * - `true` / `false` — a yes-or-no field.
 *
 * A value of a set may carry the word a reader sees for it after a tilde
 * (`cus_0004~Meridian%20Controls`), which the bar shows as the pill's value.
 */
export type DoorParams = Record<string, string>;

export interface DoorOption {
  readonly value: string;
  readonly label: string;
}

const LABEL = '~';

const ofList = (values: readonly unknown[], labels: Readonly<Record<string, string>>): string =>
  values
    .map((value) => {
      const label = labels[String(value)];
      return label === undefined ? String(value) : `${String(value)}${LABEL}${encodeURIComponent(label)}`;
    })
    .join(',');

/** The backend list filter a report's door carries, as the address's parameters. */
export function doorParams(
  filter: Readonly<Record<string, FilterValue>>,
  labels: Readonly<Record<string, string>> = {},
): DoorParams {
  const params: DoorParams = {};
  for (const [field, raw] of Object.entries(filter)) {
    if (raw === null || raw === undefined) continue;
    if (typeof raw !== 'object') {
      params[field] = typeof raw === 'string' ? ofList([raw], labels) : String(raw);
      continue;
    }
    if (Array.isArray(raw)) {
      params[field] = ofList(raw, labels);
      continue;
    }
    const clause = raw as FilterClause;
    if (clause.in !== undefined) params[field] = ofList(clause.in as unknown[], labels);
    else if (clause.not_in !== undefined) params[field] = `!${ofList(clause.not_in as unknown[], labels)}`;
    else if (clause.is_empty) params[field] = '-';
    else if (clause.is_not_empty) params[field] = '*';
    else if (clause.gt !== undefined) params[field] = `>${String(clause.gt)}`;
    else if (clause.gte !== undefined || clause.lte !== undefined)
      params[field] = `${clause.gte === undefined ? '' : String(clause.gte)}..${clause.lte === undefined ? '' : String(clause.lte)}`;
    else if (clause.eq !== undefined) params[field] = ofList([clause.eq], labels);
  }
  return params;
}

export interface DoorField {
  readonly key: string;
  readonly kind: FilterKind;
}

export interface Door {
  readonly filter: FilterGroup;
  /** The words a set's values carry in the address, by field: the pill says them. */
  readonly options: Readonly<Record<string, readonly DoorOption[]>>;
}

const toValue = (kind: FilterKind, text: string): string | number =>
  kind === 'number' ? Number(text) : text;

/**
 * The address's door parameters as the bar's tree, for the fields the list
 * offers; null when the address names none. A parameter the list has no field
 * for is not read.
 */
export function doorFilter(
  params: { get(name: string): string | null },
  fields: readonly DoorField[],
): Door | null {
  const rules: FilterRule[] = [];
  const options: Record<string, DoorOption[]> = {};
  for (const field of fields) {
    const text = params.get(field.key);
    if (text === null || text === '') continue;
    const condition = conditionOf(field, text, options);
    if (condition === null) continue;
    rules.push({
      field: field.key,
      filter: { kind: field.kind, join: 'and', conditions: [condition] } as FilterDescriptor,
    });
  }
  return rules.length === 0 ? null : { filter: { join: 'and', rules }, options };
}

function conditionOf(
  field: DoorField,
  text: string,
  options: Record<string, DoorOption[]>,
): FilterCondition<string, unknown> | null {
  const { kind } = field;
  if (text === '-') return { operator: 'empty' };
  if (text === '*') return { operator: 'notEmpty' };
  if (kind === 'boolean') return { operator: 'is', value: text === 'true' };
  if (kind === 'set' || kind === 'text') {
    const none = text.startsWith('!');
    const values = (none ? text.slice(1) : text).split(',').map((entry) => {
      const [value = '', label] = entry.split(LABEL);
      if (label !== undefined) {
        const list = options[field.key] ?? [];
        list.push({ value, label: decodeURIComponent(label) });
        options[field.key] = list;
      }
      return value;
    });
    if (kind === 'text') return { operator: none ? 'notEquals' : 'equals', value: values[0] };
    return { operator: none ? 'noneOf' : 'anyOf', value: values };
  }
  if (text.startsWith('>')) return { operator: 'greaterThan', value: toValue(kind, text.slice(1)) };
  const range = /^(.*)\.\.(.*)$/.exec(text);
  if (range) {
    const [, low = '', high = ''] = range;
    if (low !== '' && high !== '') {
      if (kind === 'date' && low === high) return { operator: 'is', value: low };
      return { operator: 'between', value: toValue(kind, low), end: toValue(kind, high) };
    }
    // A day's `after` and `before` exclude the day itself, which an open end includes: a day is read closed.
    if (kind === 'date') return null;
    if (low !== '') return { operator: 'greaterThanOrEqual', value: toValue(kind, low) };
    if (high !== '') return { operator: 'lessThanOrEqual', value: toValue(kind, high) };
    return null;
  }
  return { operator: kind === 'date' ? 'is' : 'equals', value: toValue(kind, text) };
}

/** A field's options with the ones the door named added, so its pill speaks the record's name. */
export function withDoorOptions<F extends { key: string; options?: readonly DoorOption[] }>(
  fields: readonly F[],
  door: Door | null,
): F[] {
  if (door === null) return [...fields];
  return fields.map((field) => {
    const named = door.options[field.key];
    if (!named || named.length === 0) return field;
    const known = new Set((field.options ?? []).map((option) => option.value));
    return { ...field, options: [...(field.options ?? []), ...named.filter((option) => !known.has(option.value))] };
  });
}

/** The two filters every customer-based list shares with the reports: the account's region and segment. */
export const REGION_OPTIONS: readonly DoorOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'BR', label: 'Brazil' },
];
export const SEGMENT_OPTIONS: readonly DoorOption[] = [
  { value: 'strategic', label: 'Strategic' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'mid_market', label: 'Mid-market' },
  { value: 'smb', label: 'SMB' },
];

export interface DoorBarField extends DoorField {
  readonly label: string;
  readonly options?: readonly DoorOption[];
  readonly operators?: readonly string[];
  readonly section?: string;
  readonly pinned?: boolean;
}

export const regionField = (section?: string): DoorBarField => ({
  key: 'regionCode',
  label: 'Region',
  kind: 'set',
  options: REGION_OPTIONS,
  operators: ['anyOf'],
  ...(section ? { section } : {}),
});

export const segmentField = (section?: string): DoorBarField => ({
  key: 'customerSegment',
  label: 'Segment',
  kind: 'set',
  options: SEGMENT_OPTIONS,
  operators: ['anyOf'],
  ...(section ? { section } : {}),
});

/**
 * A field a list offers only while a door names it: a set of records by id —
 * accounts, owners, products, suppliers — that the bar has no list of to
 * offer, and that the door names with their words.
 */
export const doorOnlyField = (key: string, label: string, kind: FilterKind = 'set'): DoorBarField => ({
  key,
  label,
  kind,
  ...(kind === 'set' ? { operators: ['anyOf', 'noneOf'] } : {}),
});

/** The bar's fields: the list's own, and the door-only ones the door names, each with the door's words. */
export function fieldsWithDoor<F extends { key: string; options?: readonly DoorOption[] }>(
  own: readonly F[],
  doorOnly: readonly F[],
  door: Door | null,
): F[] {
  const named = new Set(
    (door?.filter.rules ?? []).map((rule) => ('field' in rule ? rule.field : '')),
  );
  const owned = new Set(own.map((field) => field.key));
  return withDoorOptions(
    [...own, ...doorOnly.filter((field) => named.has(field.key) && !owned.has(field.key))],
    door,
  );
}
