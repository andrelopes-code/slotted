import type { FamilyTranslator, FieldMessages } from '@slotted/core/i18n';
import { createContext, useContext } from 'react';

import type {
  FieldContextValue,
  FieldCount,
  FieldDescribedSlot,
  FieldIds,
  FieldNecessity,
} from './field.types';

/**
 * `undefined` outside a field, which is what lets a control this library ships
 * read the field when there is one and behave as itself when there is not.
 */
export const FieldContext = createContext<FieldContextValue | undefined>(undefined);

/**
 * What the field around this component says, or `undefined` if there is none.
 *
 * It is the hook a control reads to take its identifier, its description and
 * its state without being wrapped, which is the mechanism
 * `docs/history/designs/2026-08-31-field-aware-controls-design.md` states: a
 * control that wires itself cannot be written wrong.
 */
export function useField(): FieldContextValue | undefined {
  return useContext(FieldContext);
}

/** The identifiers a field derives from its base, in one place. */
export function deriveFieldIds(base: string): FieldIds {
  return {
    control: `${base}-control`,
    counter: `${base}-counter`,
    description: `${base}-description`,
    error: `${base}-error`,
    help: `${base}-help`,
    indicator: `${base}-indicator`,
    label: `${base}-label`,
  };
}

/** The reading order of the control's description, as the contract names it. */
export const FIELD_DESCRIBED_ORDER: readonly FieldDescribedSlot[] = [
  'indicator',
  'help',
  'description',
  'counter',
  'error',
];

/**
 * What the necessity mark says, and whether a reader hears it. The asterisk is
 * hidden, because `aria-required` on the control already carries the fact and a
 * form of twenty required fields does not need "asterisk" twenty times; the
 * words are not, because `(optional)` is information rather than decoration.
 * `null` when nothing is drawn. `field-group` draws its legend's mark with the
 * same answer.
 */
export function necessityMark(
  necessity: FieldNecessity,
  required: boolean,
  t: FamilyTranslator<FieldMessages>,
): { hidden: boolean; text: string } | null {
  switch (necessity) {
    case 'mark':
      return required ? { hidden: true, text: '*' } : null;
    case 'optional':
      return required ? null : { hidden: false, text: t('optional') };
    case 'words':
      return { hidden: false, text: t(required ? 'required' : 'optional') };
    case 'none':
      return null;
  }
}

/**
 * How a count reads: `12/280` when there is a limit and `12` when there is
 * none. Carbon and Polaris both write the pair; Angular Material writes it in
 * the subscript, where a count that appears on the first keystroke shares a row
 * with the error and pushes it.
 */
export function formatFieldCount(count: FieldCount): string {
  return count.max === undefined ? String(count.length) : `${count.length}/${count.max}`;
}

/** Whether a count has passed the limit it was given. */
export function isFieldCountOver(count: FieldCount): boolean {
  return count.max !== undefined && count.length > count.max;
}

/** Whether a message part has anything to say, which decides whether it describes the control. */
export const hasFieldContent = (children: unknown) =>
  children !== undefined && children !== null && children !== false && children !== '';

type FieldCountReader = (props: never) => FieldCount | undefined;

const countReaders = new WeakMap<object, FieldCountReader>();

/**
 * Declares that a control counts its value, and how to read the count from its
 * props. The control still publishes through `setCount` in an effect; the field
 * reads the props of a control written among its children for the render
 * before that effect runs — on the server, and in the render hydration
 * compares against it.
 */
export function countsInField<P>(
  component: (props: P) => unknown,
  read: (props: P) => FieldCount | undefined,
): void {
  countReaders.set(component, read as FieldCountReader);
}

/** How a control counts from its props, if it is one that counts. */
export function fieldCountReader(
  type: unknown,
): ((props: unknown) => FieldCount | undefined) | undefined {
  return typeof type === 'function'
    ? (countReaders.get(type) as ((props: unknown) => FieldCount | undefined) | undefined)
    : undefined;
}
