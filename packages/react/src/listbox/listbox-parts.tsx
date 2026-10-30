import { keyedProps } from '@slotted/core/selector-key';
import { useId } from 'react';

import { Glyph, Icon } from '../icon';
import { useListbox } from './listbox-context';
import type {
  ListboxGroupProps,
  ListboxGroupRootProps,
  ListboxMessageProps,
  ListboxOptionProps,
  ListboxOptionRootProps,
  ListboxPartProps,
} from './listbox.types';

/** The selector the root reads its collection through, in DOM order. */
export const OPTION_SELECTOR = "[data-part='option']";

/**
 * One option, and the four facts the root reads back off it.
 *
 * The collection is read from the DOM rather than from a registry, which is
 * what `menu` already does for its typeahead: DOM order is the reading order,
 * it survives arbitrary nesting inside groups, and it cannot disagree with what
 * the reader sees. The four facts travel as data attributes — the key, the
 * value typeahead matches, whether it is disabled, and its place in the set —
 * so nothing has to be registered, unregistered or ordered by mount time.
 *
 * `aria-disabled` and never the native attribute: the pattern needs a disabled
 * option to keep its place in the set, and `navigateDisabled` is what decides
 * whether the arrows land on it.
 */
export function ListboxOption({
  children,
  disabled,
  onClick,
  onPointerDown,
  pinned,
  render,
  textValue,
  value,
  ...nativeProps
}: ListboxOptionProps) {
  const listbox = useListbox();
  const selected = listbox.isSelected(value);
  const active = listbox.isActive(value);
  const isDisabled = disabled === true || listbox.disabled === true;

  const rootProps: ListboxOptionRootProps = keyedProps({
    ...nativeProps,
    'aria-disabled': isDisabled ? true : undefined,
    'aria-posinset': listbox.posInSet(value),
    'aria-selected': listbox.selectionMode === 'none' ? undefined : selected,
    'aria-setsize': listbox.setSize,
    tabIndex: listbox.optionTabIndex(value),
    children,
    ...(active ? { 'data-current': '' } : {}),
    ...(isDisabled ? { 'data-disabled': '' } : {}),
    'data-key': value,
    'data-part': 'option',
    ...(pinned === true ? { 'data-pinned': '' } : {}),
    ...(selected ? { 'data-selected': '' } : {}),
    ...(textValue === undefined ? {} : { 'data-text-value': textValue }),
    id: listbox.optionId(value),
    onClick: (event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      listbox.press(value, event);
    },
    /**
     * The press is taken on `pointerdown` as well, and only to stop the browser
     * moving focus off the root: under `aria-activedescendant` the root is the
     * focused element, and a press that took focus to the option would leave the
     * property pointing at something that is no longer the active element.
     */
    onPointerDown: (event) => {
      onPointerDown?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
    },
    role: 'option',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * A group of options, named by its own label. The pattern requires the name —
 * "each option group has an accessible name provided via aria-label or
 * aria-labelledby" — and requires the group to hold at least one option, which
 * is the consumer's to honour.
 */
export function ListboxGroup({
  children,
  label,
  labelProps,
  render,
  ...nativeProps
}: ListboxGroupProps) {
  const labelId = `${useId()}label`;

  const rootProps: ListboxGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-labelledby': labelId,
    children: (
      <>
        <div data-part="group-label" data-part-group-label="" id={labelId} {...labelProps}>
          {label}
        </div>
        {children}
      </>
    ),
    'data-part': 'group',
    role: 'group',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * What the listbox says when it holds nothing. It lives inside the listbox for
 * the reason `list` records: outside it a reader hears "listbox, 0 items" and
 * then nothing, and the words fall outside the box a framed listbox paints.
 *
 * It carries no role. `listbox` owns `option` and `group` and nothing else, so
 * a message with a role of its own would be an owned element ARIA does not
 * permit; with none, it is the container's own text.
 */
export function ListboxEmpty({ children, render, ...nativeProps }: ListboxMessageProps) {
  const rootProps: ListboxGroupRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'empty',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The row at the end of a page that has not arrived. It is an `option` by role
 * and disabled, because a listbox owns nothing else and the row is not a choice
 * — which is also why it is not counted in `aria-setsize`.
 */
export function ListboxLoader({ children, render, ...nativeProps }: ListboxMessageProps) {
  const rootProps: ListboxGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-disabled': true,
    children,
    'data-part': 'loader',
    role: 'option',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The mark that says an option is chosen. The listbox reserves its column
 * whether or not the mark is drawn, so a list does not shift sideways as one
 * option is chosen; `indicator="none"` is what removes the column with it. The
 * tick is a `Glyph` sized by the column, and children of the consumer's own
 * replace it.
 */
export function ListboxIndicator({ children, ...nativeProps }: ListboxPartProps) {
  const listbox = useListbox();
  if (listbox.indicator === 'none') return null;

  return (
    <span aria-hidden="true" data-part="indicator" data-part-indicator="" {...nativeProps}>
      {children ?? (
        <Icon>
          <Glyph name="check" />
        </Icon>
      )}
    </span>
  );
}

/**
 * The option's own artwork, in the same column the mark uses and never beside
 * it: an `Icon` holding a `Glyph`, or an element of the consumer's own. The
 * column sizes and centres it; no stylesheet fills it.
 */
export function ListboxIcon({ children, ...nativeProps }: ListboxPartProps) {
  return (
    <span aria-hidden="true" data-part="icon" data-part-icon="" {...nativeProps}>
      {children}
    </span>
  );
}

/** The option's primary text, and the only column that gives way. */
export function ListboxLabel({ children, ...nativeProps }: ListboxPartProps) {
  return (
    <span data-part="label" data-part-label="" {...nativeProps}>
      {children}
    </span>
  );
}

/** A second line under the label, for what the label cannot say on its own. */
export function ListboxDescription({ children, ...nativeProps }: ListboxPartProps) {
  return (
    <span data-part="description" data-part-description="" {...nativeProps}>
      {children}
    </span>
  );
}

/**
 * The value beside the name — a count, a price, a status word. `menu` calls the
 * same column `shortcut` because a menu's third column holds a key binding.
 */
export function ListboxMeta({ children, ...nativeProps }: ListboxPartProps) {
  return (
    <span data-part="meta" data-part-meta="" {...nativeProps}>
      {children}
    </span>
  );
}
