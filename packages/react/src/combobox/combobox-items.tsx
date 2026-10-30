import { withSelectorKey } from '@slotted/core/selector-key';
import { matchRanges } from '@slotted/core/highlight';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode, Ref } from 'react';

import { Highlight } from '../highlight';
import { Glyph, Icon } from '../icon';
import { useCombobox } from './combobox';
import type { ComboboxGroupProps, ComboboxItemProps } from './combobox.types';

/**
 * One option, and the one that decides whether it belongs in the results.
 *
 * **Each option filters itself.** The family holds the query and the
 * comparison; the option holds its own label, which is the only place the two
 * meet without the consumer having to hand the whole collection over twice. An
 * option that does not match renders nothing, so the popup's DOM *is* the
 * result set — which is what makes the count, the keyboard and the empty row
 * all read the same answer.
 *
 * The text it filters on is `textValue`, or its children when they are a
 * string. Children that are elements cannot be compared, so such an option is
 * always shown and `textValue` is how a consumer says what it reads as.
 */
export function ComboboxItem({
  children,
  description,
  disabled = false,
  icon,
  position,
  ref,
  textValue,
  value,
  ...nativeProps
}: ComboboxItemProps) {
  const combobox = useCombobox();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const registered = useRef<string | null>(null);

  const text = textValue ?? (typeof children === 'string' ? children : undefined);

  useEffect(() => {
    if (node === null) return;
    const label = text ?? node.querySelector("[data-part='label']")?.textContent?.trim() ?? '';
    if (label === '' || label === registered.current) return;
    registered.current = label;
    combobox.registerLabel(value, label);
  }, [combobox, node, text, value]);

  /**
   * The spans the query matched, from the same collator the filter used, drawn
   * by the `highlight` family inside this family's label. An `indexOf` beside
   * a locale-sensitive filter marks nothing on the row it has just matched,
   * and the reader is left asking why an option with no visible match is in
   * the list.
   */
  const marked = useMemo((): ReactNode => {
    if (!combobox.highlightMatch || combobox.query === '' || text === undefined) return children;
    const ranges = matchRanges(text, combobox.query, { locale: combobox.locale });
    /* An option the query did not touch — a server-filtered list, or
       `autocomplete="none"` — keeps whatever the consumer wrote, which may be
       more than its text. */
    if (ranges.length === 0) return children;
    return <Highlight ranges={ranges} text={text} />;
  }, [children, combobox.highlightMatch, combobox.locale, combobox.query, text]);

  /* The filter cannot judge an option whose label is not text, so it keeps it. */
  if (text !== undefined && !combobox.matches(text)) return null;

  const selected = combobox.value === value;
  const current = combobox.highlighted === value;

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    combobox.setHighlighted(value, 'pointer', event.nativeEvent);
  };

  /**
   * The press is taken here as well, and only to stop the browser moving focus
   * off the input: an option cannot hold focus, so a press on it would take
   * focus to the body — and the settling of CB7 would run on the query the
   * reader was in the middle of choosing from, before the click arrived (CB11).
   * `listbox` refuses the press for the mirror of this reason.
   */
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    nativeProps.onPointerDown?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    combobox.select(value, 'pointer', event.nativeEvent);
    combobox.setInputValue(combobox.labelFor(value) ?? text ?? value, 'select', event.nativeEvent);
    if (combobox.closeOnSelect) combobox.setOpen(false, 'select', event.nativeEvent);
    combobox.inputNode?.focus({ preventScroll: true });
  };

  return (
    <div
      {...withSelectorKey(nativeProps, 'part', 'item')}
      aria-disabled={disabled ? true : undefined}
      aria-posinset={position}
      aria-selected={selected}
      aria-setsize={position === undefined ? undefined : combobox.total}

      data-value={value}
      {...(text === undefined ? {} : { 'data-text-value': text })}
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(selected ? { 'data-selected': '' } : {})}
      {...(current ? { 'data-current': '' } : {})}
      id={nativeProps.id ?? combobox.optionId(value)}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      ref={(element: HTMLDivElement | null) => {
        setNode(element);
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
 * A set of options under a heading, named by `aria-labelledby` pointing at its
 * own label — which the listbox pattern requires of every option group.
 *
 * A group whose every option was filtered away renders nothing at all: a
 * heading with no options under it says a category matched when none did.
 */
export function ComboboxGroup({ children, label, ...nativeProps }: ComboboxGroupProps) {
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
  const { query } = useCombobox();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [empty, setEmpty] = useState(false);

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

export function ComboboxSeparator(props: { ref?: Ref<HTMLDivElement> }) {
  return <div data-part="separator" data-part-separator="" ref={props.ref} role="separator" />;
}
