import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/field/field.css';

import { fieldMessages } from '@slotted/core/i18n';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { useMessages } from '../i18n';
import {
  deriveFieldIds,
  FIELD_DESCRIBED_ORDER,
  FieldContext,
  fieldCountReader,
  formatFieldCount,
  hasFieldContent,
  isFieldCountOver,
} from './field-context';
import { useFieldDefaults } from './field-defaults';
import {
  FieldCounter,
  FieldDescription,
  FieldError,
  FieldHeader,
  FieldHelp,
  FieldIndicator,
  FieldLabel,
} from './field-parts';
import type {
  FieldContextValue,
  FieldCount,
  FieldDescribedSlot,
  FieldProps,
  FieldRootProps,
} from './field.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/** What a field learns from its parts, by registration or by reading what it was given. */
interface FieldParts {
  count: FieldCount | undefined;
  hasCounter: boolean;
  hasHeader: boolean;
  messages: FieldDescribedSlot[];
}

const MESSAGE_PARTS = new Map<unknown, FieldDescribedSlot>([
  [FieldDescription, 'description'],
  [FieldError, 'error'],
  [FieldHelp, 'help'],
  [FieldIndicator, 'indicator'],
]);

/**
 * The parts and the counting control written among a field's children, read
 * from the element tree rather than from the effects that register them. A
 * field nested inside is not read: its parts are its own. A part a component
 * of the page's renders is not in the tree, and arrives by registration.
 */
function readParts(node: ReactNode, parts: FieldParts): FieldParts {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) readParts(child, parts);
    return parts;
  }
  if (!isValidElement<{ children?: ReactNode }>(node) || node.type === Field) return parts;
  const { props, type } = node;
  const slot = MESSAGE_PARTS.get(type);
  if (slot !== undefined && hasFieldContent(props.children)) parts.messages.push(slot);
  if (type === FieldCounter) parts.hasCounter = true;
  if (type === FieldHeader) parts.hasHeader = true;
  parts.count ??= fieldCountReader(type)?.(props);
  return readParts(props.children, parts);
}

/**
 * One control, its name, its necessity, its help and its error — and the
 * identifiers that bind the four together.
 *
 * **Every shared state is unset rather than `false`.** `disabled`, `invalid`,
 * `required` and `readOnly` default to `undefined`, so a field defers to the
 * `FieldGroup` around it and the group to the application. A field that
 * defaulted to `false` could not be told from a consumer saying "not disabled",
 * and it would quietly override a disabled section.
 *
 * **The identifiers are derived, not registered.** One base yields four, so
 * `label[for]` resolves to the identifier the control will use with no ordering
 * dependency between siblings and nothing to coordinate during hydration.
 *
 * **`aria-required`, never the native `required`.** The native attribute
 * engages browser constraint validation and changes submit behavior, which the
 * library must not impose as a side effect of describing a field. A consumer
 * who wants it writes it on the control, and it survives: an explicit value on
 * the control always wins.
 *
 * **The control counts and the field places the count.** A control this library
 * ships publishes the length of its value and the limit it was given; the field
 * draws the counter at the end of its label row — inside the `FieldHeader`
 * when the page wrote one — and only when the page has written no counter of
 * its own. A count over words, bytes or line items is one only the page can
 * compute, so a written counter always wins.
 */
export function Field({
  children,
  disabled,
  id,
  invalid,
  labelPlacement,
  messages: words,
  necessity,
  readOnly,
  ref,
  render,
  required,
  size,
  width = 'full',
  ...nativeProps
}: FieldProps) {
  const defaults = useFieldDefaults();
  const t = useMessages(fieldMessages, words);
  const generatedId = useId();
  const ids = useMemo(
    () => deriveFieldIds(id ?? `slotted-field-${generatedId}`),
    [generatedId, id],
  );

  const [registeredMessages, setMessages] = useState<readonly FieldDescribedSlot[]>([]);
  const [registeredCount, setCount] = useState<FieldCount | undefined>(undefined);
  const [registeredCounter, setHasCounter] = useState(false);
  const [registeredHeader, setHasHeader] = useState(false);
  const [registered, setRegistered] = useState(false);
  const hasControl = useRef(false);

  /**
   * The parts register in effects, and the field's own effect runs after
   * theirs in the same commit. Until it has — on the server, and in the render
   * hydration compares against it — the field is what it was given: the parts
   * and the counting control written among its children. Both renders read the
   * same tree, so hydration agrees, and registration then takes over.
   */
  useEffect(() => setRegistered(true), []);
  const given = registered
    ? undefined
    : readParts(children, { count: undefined, hasCounter: false, hasHeader: false, messages: [] });
  const messages = given?.messages ?? registeredMessages;
  const count = given === undefined ? registeredCount : given.count;
  const hasCounter = given?.hasCounter ?? registeredCounter;
  const hasHeader = given?.hasHeader ?? registeredHeader;

  const registerMessage = useCallback((slot: FieldDescribedSlot, present: boolean) => {
    setMessages((current) => {
      if (present === current.includes(slot)) return current;
      return present ? [...current, slot] : current.filter((candidate) => candidate !== slot);
    });
  }, []);

  const registerControl = useCallback(() => {
    hasControl.current = true;
  }, []);

  const registerCounter = useCallback((present: boolean) => setHasCounter(present), []);
  const registerHeader = useCallback((present: boolean) => setHasHeader(present), []);

  useEffect(() => {
    if (!isDevelopment || hasControl.current) return;
    console.warn(
      'Field rendered without a control. Wrap the control in FieldControl, or use a control that reads the field, so the label resolves.',
    );
  }, []);

  /**
   * The contract's order, whatever order the page wrote the parts in: the
   * indicator, the help, the description, the count, the error. Known slots
   * have one correct reading order, and deriving it from registration order
   * would make the accessible description depend on when an effect ran. The
   * count is there whenever one is drawn — the page's, or the one the field
   * draws from what the control published.
   */
  const counted = hasCounter || count !== undefined;
  const describedBy =
    FIELD_DESCRIBED_ORDER.filter((slot) => (slot === 'counter' ? counted : messages.includes(slot)))
      .map((slot) => ids[slot])
      .join(' ') || undefined;

  const resolvedSize = size ?? defaults.size;
  const resolvedDisabled = disabled ?? defaults.disabled;
  const resolvedReadOnly = readOnly ?? defaults.readOnly;
  const resolvedNecessity = necessity ?? defaults.necessity;

  const value: FieldContextValue = {
    count,
    describedBy,
    disabled: resolvedDisabled,
    hasCounter,
    hasHeader,
    ids,
    invalid,
    /* A message is quieter than the control it is about, so it starts one step
       below and only the largest field's message reaches the second step. */
    messageSize: resolvedSize === 'lg' ? 'md' : 'sm',
    necessity: resolvedNecessity,
    readOnly: resolvedReadOnly,
    registerControl,
    registerCounter,
    registerHeader,
    registerMessage,
    required,
    setCount,
    size: resolvedSize,
    t,
  };

  /**
   * Drawn by the field only when the page drew none and wrote no header — a
   * header draws it at its own end. The stylesheet puts it in the label row's
   * spare column wherever it stands; in the DOM it follows the label, where
   * `SlField` writes it, so a reader meets it in the order it is seen. A label
   * the page nested in an element of its own leaves it last.
   */
  const drawnCounter =
    count === undefined || hasCounter || hasHeader ? null : (
      <span
        {...(isFieldCountOver(count) ? { 'data-invalid': '' } : {})}
        data-part="counter"
        data-part-counter=""
        id={ids.counter}
      >
        {formatFieldCount(count)}
      </span>
    );

  let placed = false;
  const content = Children.map(children, (child) => {
    if (placed || !isValidElement(child) || child.type !== FieldLabel) return child;
    placed = true;
    return (
      <>
        {child}
        {drawnCounter}
      </>
    );
  });

  const rootProps: FieldRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {content}
        {placed ? null : drawnCounter}
      </>
    ),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(invalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(required === true ? { 'data-required': '' } : {}),
    'data-label-placement': labelPlacement ?? defaults.labelPlacement,
    'data-necessity': resolvedNecessity,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'field',
    'data-width': width,
  });

  return (
    <FieldContext.Provider value={value}>
      {render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps)}
    </FieldContext.Provider>
  );
}
