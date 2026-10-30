import { keyedProps } from '@slotted/core/selector-key';
import { useId } from 'react';

import { useList } from './list';
import type { ListEmptyProps, ListSectionProps, ListSectionRootProps } from './list.types';

/**
 * A group inside the set: an `li` holding a heading and a nested list, which is
 * the grouping HTML already has. MUI, Angular Material, Primer and React Aria
 * each leave the heading loose among the rows instead, so a reader hears a
 * heading inside a set rather than a set with a name.
 *
 * The nested list takes the element of the set around it, so a group inside an
 * ordered list is ordered too, and names itself by the heading — which is what
 * lets a reader who lands inside the group know which group it is.
 */
export function ListSection({
  children,
  end,
  label,
  labelProps,
  labelVariant = 'caption',
  level = '3',
  listProps,
  render,
  sticky = false,
  ...nativeProps
}: ListSectionProps) {
  const list = useList();
  const labelId = `${useId()}label`;

  const Heading = level === 'none' ? 'div' : (`h${level}` as 'h3');
  const NestedList = list?.ordered === true ? 'ol' : 'ul';

  /* The heading and the nested list are written here rather than left to the
     consumer, because the pair is the group: the heading names the list through
     `aria-labelledby`, and a reader who lands inside the group is told which
     group it is. `labelProps` and `listProps` reach each element for the id or
     the class a page owns. */
  const rootProps: ListSectionRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        <Heading
          data-part="section-label"
          data-part-section-label=""
          id={labelId}
          {...(sticky ? { 'data-sticky': '' } : {})}
          data-variant={labelVariant}
          {...labelProps}
        >
          {label}
          {end === undefined || end === null ? null : (
            <span data-part="section-end" data-part-section-end="">
              {end}
            </span>
          )}
        </Heading>
        <NestedList
          aria-labelledby={labelId}
          data-part="section-list"
          data-part-section-list=""
          role="list"
          {...listProps}
        >
          {children}
        </NestedList>
      </>
    ),
    'data-part': 'section',
  });

  return render === undefined ? <li {...rootProps} /> : render(rootProps);
}

/**
 * What the set says when it holds nothing. It is an `li`, so the reader hears
 * "list, one item" and then the message; a message outside the list leaves them
 * with "list, zero items" and silence, and leaves the words outside the box a
 * framed set paints.
 *
 * The family supplies the box, the height and the muted ink. The words are the
 * page's, and `result-state` is what goes in here.
 */
export function ListEmpty({ render, ...nativeProps }: ListEmptyProps) {
  const rootProps: ListSectionRootProps = keyedProps({ ...nativeProps, 'data-part': 'empty' });

  return render === undefined ? <li {...rootProps} /> : render(rootProps);
}
