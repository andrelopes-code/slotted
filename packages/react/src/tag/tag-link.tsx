import { definedProps, keyedProps } from '@slotted/core/selector-key';
import { useId } from 'react';
import type { SyntheticEvent } from 'react';

import { TagContent, TagFrame, TagRemove, useAppearance, useRemoval } from './tag-chip';
import type { TagLinkBodyProps, TagLinkProps } from './tag.types';

/**
 * A chip that navigates — Ant's `href`, Primer's `Token` with a destination,
 * PatternFly's link label. It is a real `<a>`, so the platform's own middle
 * click, context menu, download and "open in new tab" all keep working, and a
 * router substitutes its own component through `render`.
 *
 * `disabled` is not an attribute an anchor has. A chip that cannot be followed
 * loses its `href`, announces `aria-disabled`, and keeps its place in the tab
 * sequence — the line `link` draws for the same case: without an `href` the
 * anchor would drop out of that sequence and take its own explanation with it,
 * so the zero is stated rather than inherited. The activation is refused in
 * the capture phase, before any listener the consumer attached can run.
 */
export function TagLink({
  children,
  disabled = false,
  end,
  href,
  onAuxClickCapture,
  onClickCapture,
  onKeyDownCapture,
  onRemove,
  removeDisabled = false,
  messages,
  render,
  rootProps,
  shape,
  size,
  start,
  tabIndex,
  tone,
  variant,
  ...nativeProps
}: TagLinkProps) {
  const appearance = useAppearance({ shape, size, tone, variant });
  const removal = useRemoval({ disabled, onRemove, removeDisabled, messages });
  const id = useId();
  const labelId = `${id}label`;
  const wordId = `${id}remove`;

  /* The capture phase, so a chip that cannot be followed refuses the
     activation before any listener the consumer attached to it can run. */
  const block = (event: SyntheticEvent) => {
    if (!disabled) return false;
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation?.();
    return true;
  };

  const bodyProps: TagLinkBodyProps = keyedProps({
    ...nativeProps,
    children: (
      <TagContent end={end} labelId={labelId} start={start}>
        {children}
      </TagContent>
    ),
    'data-part': 'body',
    onAuxClickCapture: (event) => {
      if (block(event)) return;
      onAuxClickCapture?.(event);
    },
    onClickCapture: (event) => {
      if (block(event)) return;
      onClickCapture?.(event);
    },
    onKeyDownCapture: (event) => {
      if (event.key === 'Enter' && block(event)) return;
      onKeyDownCapture?.(event);
    },
    ...(disabled
      ? { 'aria-disabled': true, role: nativeProps.role ?? 'link', tabIndex: tabIndex ?? 0 }
      : { href, ...(tabIndex === undefined ? {} : { tabIndex }) }),
  });

  return (
    <TagFrame appearance={appearance} disabled={disabled} removal={removal} rootProps={rootProps}>
      {render === undefined ? <a {...bodyProps} /> : render(definedProps(bodyProps))}
      {removal.removable ? <TagRemove labelId={labelId} removal={removal} wordId={wordId} /> : null}
    </TagFrame>
  );
}
