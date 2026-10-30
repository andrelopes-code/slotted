import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/field-group/field-group.css';

import { fieldMessages } from '@slotted/core/i18n';
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { FieldDefaultsProvider, useFieldDefaults } from '../field';
import { useMessages } from '../i18n';
import { FieldGroupDescription, FieldGroupError, hasContent } from './field-group-parts';
import type {
  FieldGroupContextValue,
  FieldGroupIds,
  FieldGroupProps,
  FieldGroupRootProps,
} from './field-group.types';

export const FieldGroupContext = createContext<FieldGroupContextValue | undefined>(undefined);

/** What the group around this component says, or `undefined` if there is none. */
export function useFieldGroup(): FieldGroupContextValue | undefined {
  return useContext(FieldGroupContext);
}

/** The three identifiers a group derives from its base, in one place. */
export function deriveFieldGroupIds(base: string): FieldGroupIds {
  return {
    description: `${base}-description`,
    error: `${base}-error`,
    legend: `${base}-legend`,
  };
}

type FieldGroupMessageSlot = 'description' | 'error';

/**
 * The description and the error written among a group's children, read from
 * the element tree rather than from the effects that register them. A group
 * nested inside is not read: its messages are its own. A message a component
 * of the page's renders is not in the tree, and arrives by registration.
 */
function readMessages(node: ReactNode, found: Set<FieldGroupMessageSlot>) {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) readMessages(child, found);
    return found;
  }
  if (!isValidElement<{ children?: ReactNode }>(node) || node.type === FieldGroup) return found;
  const { props, type } = node;
  if (type === FieldGroupDescription || type === FieldGroupError) {
    if (hasContent(props.children)) {
      found.add(type === FieldGroupDescription ? 'description' : 'error');
    }
    return found;
  }
  return readMessages(props.children, found);
}

/**
 * A set of fields under one name.
 *
 * **The platform does the work.** The element is a native `fieldset` and the
 * name is a native `legend` — the technique the APG's naming practice calls for
 * under its Rule 3, prefer native techniques — so the `group` role and the
 * accessible name arrive without a single ARIA attribute. `disabled` is the
 * native attribute, and every control inside is disabled by the browser with
 * nothing passed down.
 *
 * **What is said about the set is said before the set.** The description and
 * the error come between the legend and the fields, which is where GOV.UK's
 * fieldset example puts a hint and an error, and the opposite of where a single
 * field puts its own.
 *
 * **`aria-describedby` goes on the fieldset.** A reader entering any control in
 * the group hears the group's hint and its error once, from the element that
 * names them both.
 *
 * **The group provides for its fields.** `size`, `labelPlacement`,
 * `necessity`, `disabled` and `readOnly` reach every
 * field inside through the same provider an application uses, so a compact
 * section is one attribute rather than one per field. `required` is not
 * provided: it is a fact about one value, and a section cannot know it.
 */
export function FieldGroup({
  'aria-describedby': describedBy,
  children,
  disabled,
  id,
  invalid,
  kind,
  labelPlacement,
  messages: words,
  necessity,
  orientation,
  readOnly,
  ref,
  render,
  required,
  size,
  ...nativeProps
}: FieldGroupProps) {
  const defaults = useFieldDefaults();
  const t = useMessages(fieldMessages, words);
  const generatedId = useId();
  const ids = useMemo(
    () => deriveFieldGroupIds(id ?? `slotted-field-group-${generatedId}`),
    [generatedId, id],
  );

  const [registeredMessages, setMessages] = useState<readonly FieldGroupMessageSlot[]>([]);
  const [registered, setRegistered] = useState(false);

  /**
   * The messages register in effects, and the group's own effect runs after
   * theirs in the same commit. Until it has — on the server, and in the render
   * hydration compares against it — the group is described by the messages
   * written among its children, so both renders agree; registration then
   * takes over.
   */
  useEffect(() => setRegistered(true), []);
  const messages: readonly FieldGroupMessageSlot[] = registered
    ? registeredMessages
    : [...readMessages(children, new Set())];

  const registerMessage = useCallback((slot: FieldGroupMessageSlot, present: boolean) => {
    setMessages((current) => {
      if (present === current.includes(slot)) return current;
      return present ? [...current, slot] : current.filter((candidate) => candidate !== slot);
    });
  }, []);

  const resolvedSize = size ?? defaults.size;
  const resolvedNecessity = necessity ?? defaults.necessity;

  const merged =
    [
      describedBy,
      messages.includes('description') ? ids.description : undefined,
      messages.includes('error') ? ids.error : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const value: FieldGroupContextValue = {
    ids,
    kind: kind ?? 'question',
    /**
     * One step louder than a field's own. `inline-message` defines `md` as the
     * message of a section and `sm` as the message of a field, and what a group
     * says is about the section — held at the field's step, the sentence about
     * a whole set read as the help under the control above it.
     */
    messageSize: resolvedSize === 'sm' ? 'sm' : 'md',
    invalid,
    necessity: resolvedNecessity,
    registerMessage,
    required,
    size: resolvedSize,
    t,
  };

  const rootProps: FieldGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-describedby': merged,
    children,
    ...(disabled === true ? { 'data-disabled': '' } : {}),
    ...(invalid === true ? { 'data-invalid': '' } : {}),
    ...(readOnly === true ? { 'data-readonly': '' } : {}),
    ...(required === true ? { 'data-required': '' } : {}),
    'data-kind': value.kind,
    'data-orientation': orientation ?? 'vertical',
    'data-necessity': resolvedNecessity,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'field-group',
    disabled,
  });

  return (
    <FieldGroupContext.Provider value={value}>
      <FieldDefaultsProvider
        disabled={disabled}
        labelPlacement={labelPlacement}
        necessity={resolvedNecessity}
        readOnly={readOnly}
        size={resolvedSize}
      >
        {render === undefined ? <fieldset {...rootProps} ref={ref} /> : render(rootProps)}
      </FieldDefaultsProvider>
    </FieldGroupContext.Provider>
  );
}
