import { withSelectorKey } from '@slotted/core/selector-key';
import { matchRanges } from '@slotted/core/highlight';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode, Ref } from 'react';

import { Highlight } from '../highlight';
import { Glyph, Icon } from '../icon';
import { useMultiSelect } from './multi-select';
import type { MultiSelectGroupProps, MultiSelectItemProps } from './multi-select.types';

/**
 * One option, and the one that decides whether it belongs in the results.
 *
 * **Each option filters itself**, as `combobox`'s does: the family holds the
 * query and the comparison, the option holds its own label, and the popup's DOM
 * is therefore the result set — which is what makes the count, the keyboard and
 * the empty row all read the same answer.
 *
 * **An option the set already holds is still an option.** It carries
 * `aria-selected="true"` and the check, and pressing it takes the value back
 * out; `chosenOptions="hide"` is the other answer, for a list long enough that
 * a reader would rather see only what is left.
 */
export function MultiSelectItem({
  children,
  description,
  disabled = false,
  icon,
  position,
  ref,
  textValue,
  value,
  ...nativeProps
}: MultiSelectItemProps) {
  const multiSelect = useMultiSelect();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const registered = useRef<string | null>(null);

  const text = textValue ?? (typeof children === 'string' ? children : undefined);

  useEffect(() => {
    if (node === null) return;
    const label = text ?? node.querySelector("[data-part='label']")?.textContent?.trim() ?? '';
    if (label === '' || label === registered.current) return;
    registered.current = label;
    multiSelect.registerLabel(value, label);
  }, [multiSelect, node, text, value]);

  const marked = useMemo((): ReactNode => {
    if (!multiSelect.highlightMatch || multiSelect.query === '' || text === undefined)
      return children;
    const ranges = matchRanges(text, multiSelect.query, { locale: multiSelect.locale });
    /* An option the query did not touch — a server-filtered list — keeps
       whatever the consumer wrote, which may be more than its text. */
    if (ranges.length === 0) return children;
    return <Highlight ranges={ranges} text={text} />;
  }, [children, multiSelect.highlightMatch, multiSelect.locale, multiSelect.query, text]);

  /* The filter cannot judge an option whose label is not text, so it keeps it. */
  if (text !== undefined && !multiSelect.matches(text)) return null;

  const selected = multiSelect.value.includes(value);
  if (selected && multiSelect.chosenOptions === 'hide') return null;

  const current = multiSelect.highlighted === value;
  /**
   * A full control refuses every value it does not already hold, and says so
   * where a reader can hear it. A control that silently ignores a press is a
   * control the reader presses again — the failure PrimeNG and Zag each leave
   * in place at the limit.
   */
  const refused = multiSelect.full && !selected;
  const inert = disabled || refused;

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (inert) return;
    multiSelect.setHighlighted(value, 'pointer', event.nativeEvent);
  };

  /**
   * The press is taken here only to stop the browser moving focus off the
   * field: an option cannot hold focus, so a press on it would take focus to
   * the body and the blur path would run in the middle of a choice.
   */
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    nativeProps.onPointerDown?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (inert) return;
    multiSelect.toggle(value, 'select', event.nativeEvent);
    multiSelect.setInputValue('', 'select', event.nativeEvent);
    if (multiSelect.closeOnSelect) multiSelect.setOpen(false, 'select', event.nativeEvent);
    multiSelect.inputNode?.focus({ preventScroll: true });
  };

  return (
    <div
      {...withSelectorKey(nativeProps, 'part', 'item')}
      aria-disabled={inert ? true : undefined}
      aria-posinset={position}
      aria-selected={selected}
      aria-setsize={position === undefined ? undefined : multiSelect.total}

      data-value={value}
      {...(text === undefined ? {} : { 'data-text-value': text })}
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(selected ? { 'data-selected': '' } : {})}
      {...(current ? { 'data-current': '' } : {})}
      id={nativeProps.id ?? multiSelect.optionId(value)}
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
export function MultiSelectGroup({ children, label, ...nativeProps }: MultiSelectGroupProps) {
  const labelId = `${useId()}group`;
  /* The query and the set, read only so that a change in either re-renders this
     group. Without the read React bails out on identical props and the
     measurement below stands from the moment the popup opened. */
  const { query, value } = useMultiSelect();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (node === null) return;
    setEmpty(node.querySelector("[data-part='item']") === null);
  }, [node, query, value]);

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

export function MultiSelectSeparator(props: { ref?: Ref<HTMLDivElement> }) {
  return <div data-part="separator" data-part-separator="" ref={props.ref} role="separator" />;
}
