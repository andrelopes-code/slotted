import { withSelectorKey } from '@slotted/core/selector-key';
import { matchRanges } from '@slotted/core/highlight';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode, Ref } from 'react';

import { Highlight } from '../highlight';
import { Glyph, Icon } from '../icon';
import { useSelect } from './select';
import type { SelectGroupProps, SelectItemProps } from './select.types';

/**
 * One option.
 *
 * A `div` with `role="option"` rather than a `button`, which is where this
 * family parts company with `menu`. The listbox pattern's option is not a
 * button: it is not separately focusable — DOM focus stays on the control for
 * the whole interaction — and a `button` here would put a widget inside a
 * widget and add a tab stop the pattern excludes by name.
 *
 * **The highlight is set by the pointer as well as by the keyboard.** Entering
 * an option with the pointer moves `aria-activedescendant` to it, so exactly one
 * option is highlighted whichever device is driving, and the state a screen
 * reader announces is the state the eye sees. `data-highlighted` in Radix and
 * Ark exists to paper over the case where those two disagree; there is no such
 * case here.
 *
 * **Under `search`, each option decides whether it belongs in the results.**
 * The family holds the query and the comparison; the option holds its own
 * label, which is the only place the two meet without the consumer handing the
 * whole collection over twice. An option that does not match renders nothing,
 * so the popup's DOM *is* the result set — which is what makes the count, the
 * keyboard and the empty row read one answer. `combobox` filters itself the
 * same way, in the same place.
 */
export function SelectItem({
  children,
  description,
  disabled = false,
  icon,
  position,
  ref,
  textValue,
  value,
  ...nativeProps
}: SelectItemProps) {
  const select = useSelect();
  /* A ref rather than state: held in state, attaching the option rendered it
     a second time before its label could be read — one commit later than the
     closed control's collection pass waits for. */
  const node = useRef<HTMLDivElement | null>(null);
  const registered = useRef<string | null>(null);

  /**
   * The label reaches the closed control through here. `textValue` when the
   * consumer gave one, the rendered text when they did not — read from the DOM
   * because the children may be elements, and what a reader sees is the honest
   * answer either way.
   */
  useEffect(() => {
    if (node.current === null) return;
    const label =
      textValue ?? node.current.querySelector("[data-part='label']")?.textContent?.trim() ?? '';
    if (label === '' || label === registered.current) return;
    registered.current = label;
    select.registerLabel(value, label);
  }, [children, select, textValue, value]);

  const text = textValue ?? (typeof children === 'string' ? children : undefined);

  /**
   * The label, split into the runs the query matched and the runs it did not,
   * by the same collator the filter used. An `indexOf` beside a
   * locale-sensitive filter marks nothing on the row it has just matched, and
   * the reader is left asking why an option with no visible match is in the
   * list. The mark itself is the `highlight` family's, rendered inside this
   * family's label, so every list a reader types into says the same thing
   * about the same span.
   */
  const marked = useMemo((): ReactNode => {
    if (!select.search || !select.highlightMatch) return children;
    if (select.query === '' || text === undefined) return children;
    const ranges = matchRanges(text, select.query, { locale: select.locale });
    /* An option the query did not touch — a server-filtered list — keeps
       whatever the consumer wrote, which may be more than its text. */
    if (ranges.length === 0) return children;
    return <Highlight ranges={ranges} text={text} />;
  }, [children, select.highlightMatch, select.locale, select.query, select.search, text]);

  /* The filter cannot judge an option whose label is not text, so it keeps it. */
  if (text !== undefined && !select.matches(text)) return null;

  const selected = select.selection.includes(value);
  const current = select.highlighted === value;

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    select.setHighlighted(value, 'pointer', event.nativeEvent);
  };

  /**
   * The press is taken here as well, and only to stop the browser moving focus
   * off the trigger: an option cannot hold focus, so a press on it would leave
   * `aria-activedescendant` on a button that is no longer the active element
   * (CB11). `listbox` and `combobox` refuse the press for the same reason.
   */
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    nativeProps.onPointerDown?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    select.toggle(value, 'pointer', event.nativeEvent);
    /* Multiple selection keeps the popup open, so a reader can take three
       options without reopening it twice — the listbox pattern's recommended
       model, and what `closeOnSelect` lets an application overrule. */
    if (select.closeOnSelect && !select.multiple) {
      select.setOpen(false, 'select', event.nativeEvent);
      return;
    }
    /* The popup stayed open, so the query is emptied here rather than by the
       close: a list still filtered to the one row the reader has just taken is
       a list that looks broken. Closing clears it too, under `clear`, and the
       two paths never both run. */
    select.setQuery('', 'select', event.nativeEvent);
    select.searchNode?.focus({ preventScroll: true });
  };

  return (
    <div
      {...withSelectorKey(nativeProps, 'part', 'item')}
      aria-disabled={disabled ? true : undefined}
      aria-posinset={position}
      aria-setsize={position === undefined ? undefined : select.total}
      aria-selected={selected}

      data-value={value}
      /* The element `aria-activedescendant` names. Built from the select's own
         identifier and this option's value, so the control can name an option
         it is not rendering — the trigger writes the attribute, and the option
         is in another subtree at the end of the document. */
      id={nativeProps.id ?? select.optionId(value)}
      {...(text === undefined ? {} : { 'data-text-value': text })}
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(selected ? { 'data-selected': '' } : {})}
      {...(current ? { 'data-current': '' } : {})}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
      role="option"
    >
      {icon === undefined ? null : (
        <span data-part="icon" data-part-icon="">
          {icon}
        </span>
      )}
      <span data-part="label" data-part-label="">
        {marked}
      </span>
      {description === undefined ? null : (
        <span data-part="description" data-part-description="">
          {description}
        </span>
      )}
      <span data-part="indicator" data-part-indicator="">
        <Icon>
          <Glyph name="check" />
        </Icon>
      </span>
    </div>
  );
}

/**
 * A set of options under a heading.
 *
 * The group names itself by `aria-labelledby` pointing at its own label, which
 * the listbox pattern requires of every option group. The label is a prop
 * rather than a child part, because a group with no accessible name is a
 * pattern violation the type system can refuse.
 */
export function SelectGroup({ children, label, ...nativeProps }: SelectGroupProps) {
  /* `useId` rather than a counter: a counter increments differently on the
     server and on the client, and the two ids then disagree at hydration. */
  const labelId = `${useId()}group`;
  /**
   * The query, read only so that a moving query re-renders this group.
   * Nothing here uses it otherwise: the options decide for themselves whether
   * they match, and the group only counts what survived.
   *
   * Without the read, React bails out of re-rendering a group whose props are
   * identical between renders — which is every group, because the consumer's
   * JSX is the same element on both sides of a keystroke — and the effect below
   * never runs again. The measurement then stands from the moment the popup
   * opened: a group emptied by a query typed *after* the popup was already open
   * stayed on the surface with nothing under it.
   */
  const { query } = useSelect();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [empty, setEmpty] = useState(false);

  /* A group whose every option was filtered away renders nothing at all: a
     heading with no options under it says a category matched when none did.
     `combobox` hides its groups the same way, from the same measurement. */
  useEffect(() => {
    if (node === null) return;
    setEmpty(node.querySelector("[data-part='item']") === null);
  }, [node, query]);

  return (
    <div
      {...withSelectorKey(nativeProps, 'part', 'group')}
      aria-labelledby={labelId}

      hidden={empty}
      ref={setNode}
      role="group"
    >
      <div data-part="group-label" data-part-group-label="" id={labelId}>
        {label}
      </div>
      {children}
    </div>
  );
}

/**
 * A line between two sets of options. `role="separator"` inside a listbox is a
 * structural element and takes no orientation: the line is horizontal because
 * the list is vertical, and saying so twice is how two families came to
 * disagree about which axis the word names.
 */
export function SelectSeparator(props: { ref?: Ref<HTMLDivElement> }) {
  return <div data-part="separator" data-part-separator="" ref={props.ref} role="separator" />;
}
