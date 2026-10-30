/**
 * What a flow of steps knows about itself, resolved once for both bindings.
 *
 * A step is named, not numbered: a branch that inserts a step renumbers every
 * index after it, and a bookmarked `?step=3` would open another step. The value
 * a flow holds is its accepted answers, keyed by step name, so a step is
 * complete exactly when its name is in the value — a value a server sent back
 * declares which steps are done without a second field.
 *
 * The list of steps is whatever the consumer renders, and it changes under the
 * reader. Every function here takes the list as it is now, and the rules for a
 * list that changed are eight cases, one per kind of change.
 *
 * Nothing here touches the DOM or a framework, except `storagePersistence`,
 * which reads the `Storage` it is given.
 */

import { stepReachable } from '../steps/steps';

/** One step's accepted answers. */
export type StepValues = Readonly<Record<string, unknown>>;

/** Every accepted answer, by step name. */
export type WizardValue = Readonly<Record<string, StepValues>>;

/** One step as the flow sees it. */
export interface WizardStepEntry {
  name: string;
  /** Out of reach and stepped over, whatever the flow's order says. */
  disabled?: boolean | undefined;
}

/** Where an accepted step leads. */
export type WizardDestination = { kind: 'step'; name: string } | { kind: 'submit' };

export function stepComplete(value: WizardValue, name: string): boolean {
  return Object.hasOwn(value, name);
}

/**
 * Two steps with one name would share one answer, and a flow with no steps has
 * nothing to show; both are a consumer's mistake a render would otherwise hide.
 */
export function assertUniqueSteps(steps: readonly WizardStepEntry[]): void {
  if (steps.length === 0) throw new Error('A wizard rendered no steps.');
  const seen = new Set<string>();
  for (const { name } of steps) {
    if (seen.has(name)) throw new Error(`Two wizard steps share the name "${name}".`);
    seen.add(name);
  }
}

function indexOf(steps: readonly WizardStepEntry[], name: string | undefined): number {
  return name === undefined ? -1 : steps.findIndex((step) => step.name === name);
}

function usable(step: WizardStepEntry | undefined): step is WizardStepEntry {
  return step !== undefined && step.disabled !== true;
}

/** `Array.prototype.findLast`, which the library's target does not have yet. */
function findLast<T>(items: readonly T[], match: (item: T) => boolean): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index] as T;
    if (match(item)) return item;
  }
  return undefined;
}

export interface ReachableStepInput {
  steps: readonly WizardStepEntry[];
  value: WizardValue;
  /** The step the reader is on. */
  current: string | undefined;
  /** The step the reader asks for. */
  target: string;
  linear: boolean;
}

/**
 * Whether the reader may go to a step by its header: `stepReachable` of
 * `@slotted/core/steps`, over names, with completion read from the value.
 */
export function reachableStep({ steps, value, current, target, linear }: ReachableStepInput) {
  const index = indexOf(steps, target);
  if (index === -1) return false;
  return stepReachable({
    count: steps.length,
    disabled: steps[index]?.disabled === true,
    index,
    isComplete: (candidate) => {
      const step = steps[candidate];
      return step !== undefined && (step.disabled === true || stepComplete(value, step.name));
    },
    linear,
    step: Math.max(0, indexOf(steps, current)),
  });
}

export interface FirstIncompleteInput {
  steps: readonly WizardStepEntry[];
  value: WizardValue;
}

/** The first present step, not disabled, whose answers were not accepted. */
export function firstIncomplete({ steps, value }: FirstIncompleteInput): string | undefined {
  return steps.find((step) => usable(step) && !stepComplete(value, step.name))?.name;
}

export interface ClampStepInput {
  steps: readonly WizardStepEntry[];
  value: WizardValue;
  /** The step asked for by a URL, a restore or a controlled value. */
  requested: string | undefined;
  linear: boolean;
}

/**
 * The step to show for one that was asked for.
 *
 * Only a *requested* step is clamped — a URL, a restored draft, a controlled
 * value. The step the reader is on is never moved because the list changed
 * around it (decision 1): a step that appears before it is asked by the next
 * advance instead, which is `nextDestination`'s job.
 *
 * A requested step that is absent, disabled or out of reach becomes the first
 * incomplete step; when every step is complete, the last usable one.
 */
export function clampStep({ steps, value, requested, linear }: ClampStepInput): string | undefined {
  const index = indexOf(steps, requested);
  const candidate = steps[index];
  if (usable(candidate)) {
    const open = firstIncomplete({ steps, value });
    const openIndex = indexOf(steps, open);
    if (!linear || openIndex === -1 || index <= openIndex) return candidate.name;
  }
  return firstIncomplete({ steps, value }) ?? findLast(steps, usable)?.name;
}

export interface NextDestinationInput {
  steps: readonly WizardStepEntry[];
  /** The value with the step just accepted already in it. */
  value: WizardValue;
  /** The step just accepted. */
  current: string;
  /** Where an edit started, when the reader came from a review step. */
  returnTo?: string | undefined;
}

/**
 * Where an accepted step leads.
 *
 * - With a return point: the first incomplete step between the current step
 *   and the return point, otherwise the return point (GOV.UK: a changed
 *   answer that opens a new question asks it before returning). A return
 *   point that left the list is dropped (decision 3).
 * - Otherwise the next usable step — unless an incomplete step stands before
 *   it, which is asked first (decision 1: a step that appeared before the
 *   current one).
 * - After the last step: the submission, unless a step is still incomplete.
 */
export function nextDestination({
  steps,
  value,
  current,
  returnTo,
}: NextDestinationInput): WizardDestination {
  const from = indexOf(steps, current);
  const back = indexOf(steps, returnTo);

  if (back > from && usable(steps[back])) {
    const between = steps
      .slice(from + 1, back)
      .find((step) => usable(step) && !stepComplete(value, step.name));
    return { kind: 'step', name: (between ?? steps[back]!).name };
  }

  const next = steps.slice(from + 1).find(usable);
  const earlier = steps
    .slice(0, from === -1 ? 0 : from)
    .find((step) => usable(step) && !stepComplete(value, step.name));
  if (earlier !== undefined) return { kind: 'step', name: earlier.name };
  if (next !== undefined) return { kind: 'step', name: next.name };

  const open = firstIncomplete({ steps, value });
  return open === undefined || open === current ? { kind: 'submit' } : { kind: 'step', name: open };
}

export interface PreviousStepInput {
  steps: readonly WizardStepEntry[];
  current: string;
}

/** The previous usable step, or nothing on the first. */
export function previousStep({ steps, current }: PreviousStepInput): string | undefined {
  const from = indexOf(steps, current);
  if (from <= 0) return undefined;
  return findLast(steps.slice(0, from), usable)?.name;
}

export interface ReplacementStepInput {
  /** The list before it changed. */
  before: readonly WizardStepEntry[];
  /** The list now. */
  after: readonly WizardStepEntry[];
  current: string;
}

/**
 * The step to go to when the current one left the list: the next one that is
 * still present, in the old order, or the previous one when nothing after it
 * is. A current step still present stays, wherever the list changed.
 */
export function replacementStep({ before, after, current }: ReplacementStepInput) {
  const present = (name: string) => after.some((step) => step.name === name && usable(step));
  if (present(current)) return current;

  const from = indexOf(before, current);
  const forward = before.slice(from + 1).find((step) => present(step.name));
  if (forward !== undefined) return forward.name;
  const backward = findLast(before.slice(0, Math.max(0, from)), (step) => present(step.name));
  return backward?.name ?? after.find(usable)?.name;
}

/**
 * The value restricted to the steps present: what a submission receives. An
 * absent step keeps its answer in the value, so including it again gives the
 * answer back; it is not submitted (guide §15, Data Entry Form).
 */
export function includedValues(value: WizardValue, steps: readonly WizardStepEntry[]) {
  const included: Record<string, StepValues> = {};
  for (const { name } of steps) {
    if (stepComplete(value, name)) included[name] = value[name]!;
  }
  return included;
}

/** One-based position among the steps present, for "Step 2 of 5". */
export function stepPosition(steps: readonly WizardStepEntry[], name: string | undefined) {
  return { count: steps.length, index: indexOf(steps, name) + 1 };
}

/** A form's values in document order; a name that repeats is a list. */
export function formValues(
  data: FormData,
): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const key of new Set(data.keys())) {
    const all = data.getAll(key);
    values[key] = all.length > 1 ? all : (all[0] as FormDataEntryValue);
  }
  return values;
}

/** What a draft holds. */
export interface WizardSnapshot {
  /** The consumer's version of the flow; another version is not restored. */
  version: string | number | undefined;
  /** The step's name. */
  step: string;
  /** The accepted answers. */
  value: WizardValue;
  /** The typed answers not yet accepted, per step. */
  drafts: WizardValue;
  /** ISO 8601. */
  savedAt: string;
}

export interface CreateSnapshotInput {
  version?: string | number | undefined;
  step: string;
  value: WizardValue;
  drafts: WizardValue;
  now?: Date | undefined;
}

export function createSnapshot({
  version,
  step,
  value,
  drafts,
  now = new Date(),
}: CreateSnapshotInput): WizardSnapshot {
  return { drafts, savedAt: now.toISOString(), step, value, version };
}

const isRecord = (candidate: unknown): candidate is Record<string, unknown> =>
  typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate);

const isValue = (candidate: unknown): candidate is WizardValue =>
  isRecord(candidate) && Object.values(candidate).every(isRecord);

/**
 * A snapshot read back from wherever it was kept, or nothing. Total: a record
 * of the wrong shape or another version gives nothing rather than an error,
 * so a draft written by an older build degrades to no draft on first paint.
 */
export function readSnapshot(
  raw: unknown,
  version: string | number | undefined,
): WizardSnapshot | undefined {
  if (!isRecord(raw)) return undefined;
  const { drafts, savedAt, step, value } = raw;
  if (typeof step !== 'string' || typeof savedAt !== 'string') return undefined;
  if (!isValue(value) || !isValue(drafts)) return undefined;
  if ((raw['version'] ?? undefined) !== version) return undefined;
  return { drafts, savedAt, step, value, version };
}

/** Where drafts are kept: three calls, each allowed to be asynchronous. */
export interface WizardPersistence {
  load(): WizardSnapshot | undefined | Promise<WizardSnapshot | undefined>;
  save(snapshot: WizardSnapshot): void | Promise<void>;
  clear(): void | Promise<void>;
}

/** A persistence whose load answers at once, which is what `Storage` gives. */
export interface SyncWizardPersistence extends WizardPersistence {
  load(): WizardSnapshot | undefined;
  save(snapshot: WizardSnapshot): void;
  clear(): void;
}

export interface StoragePersistenceInput {
  key: string;
  /** `session` survives a reload, `local` a closed browser. */
  storage: 'session' | 'local' | Storage;
  version?: string | number | undefined;
}

/**
 * Drafts in `sessionStorage` or `localStorage`, synchronously, so a reload
 * paints the restored step on its first render.
 *
 * A `File` or `Blob` is omitted: `Storage` holds strings. A draft of another
 * version, or one that is not JSON, is cleared rather than restored.
 */
export function storagePersistence({
  key,
  storage,
  version,
}: StoragePersistenceInput): SyncWizardPersistence {
  const resolve = (): Storage | undefined => {
    if (typeof storage !== 'string') return storage;
    if (typeof window === 'undefined') return undefined;
    return storage === 'session' ? window.sessionStorage : window.localStorage;
  };

  return {
    clear() {
      resolve()?.removeItem(key);
    },
    load() {
      const store = resolve();
      const text = store?.getItem(key);
      if (store === undefined || text === null || text === undefined) return undefined;
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        store.removeItem(key);
        return undefined;
      }
      const snapshot = readSnapshot(parsed, version);
      if (snapshot === undefined) store.removeItem(key);
      return snapshot;
    },
    save(snapshot) {
      resolve()?.setItem(
        key,
        JSON.stringify({ ...snapshot, version }, (_, entry: unknown) =>
          typeof Blob !== 'undefined' && entry instanceof Blob ? undefined : entry,
        ),
      );
    },
  };
}
