import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { spokenText } from '@slotted/core/text';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useSelect } from './select';

/**
 * The bottom sheet of a select on a phone: a modal layer over a scrim, with
 * focus on the list it holds and given back to the trigger as it closes. Its
 * grip is pulled down to dismiss it, as the grip of every other sheet is.
 * Answers the words that head it: the label of the control, as a reader
 * hears it.
 */
export function useSelectSheet(
  layer: HTMLElement | null,
  surface: HTMLElement | null,
  list: HTMLElement | null,
): string {
  const select = useSelect();
  const latest = useRef(select);
  latest.current = select;

  const { closeOnEscape, closeOnOutsidePress, open, sheet, triggerNode } = select;
  const shown = sheet && open ? surface : null;
  const [heading, setHeading] = useState('');

  /* No positioner places a sheet, so nothing else writes the open state. */
  useLayoutEffect(() => {
    if (layer === null || shown === null) return;

    layer.setAttribute('data-open', '');
    setHeading(labelOf(latest.current.triggerNode));

    return () => layer.removeAttribute('data-open');
  }, [layer, shown]);

  useEffect(() => {
    if (layer === null || shown === null) return;

    const dismissable = createDismissableLayer(layer, {
      back: true,
      branches: triggerNode === null ? [] : [triggerNode],
      content: shown,
      escape: closeOnEscape,
      modal: true,
      outsidePress: closeOnOutsidePress,
      outsidePressEvent: 'click',
      onDismiss: ({ reason, source }) => {
        latest.current.setOpen(
          false,
          reason === 'outsidePress' ? 'outsidePress' : 'escape',
          source,
        );
      },
    });

    return () => {
      /* The layer first: focus given back to an `inert` trigger is refused. */
      dismissable.destroy();
      latest.current.triggerNode?.focus({ preventScroll: true });
    };
  }, [closeOnEscape, closeOnOutsidePress, layer, shown, triggerNode]);

  /* The list holds focus and names the highlighted option, as the trigger does anchored. */
  useEffect(() => {
    if (shown === null || list === null) return;

    list.focus({ preventScroll: true });
  }, [list, shown]);

  useEffect(() => {
    const grip = shown?.querySelector<HTMLElement>(':scope > [data-part="grip"]');
    if (shown == null || grip == null) return;

    return attachGripDismiss({
      grip,
      scrim: layer?.querySelector<HTMLElement>(':scope > [data-part="backdrop"]'),
      sheet: shown,
      onDismiss: (event) => latest.current.setOpen(false, 'pointer', event),
    });
  }, [layer, shown]);

  return heading;
}

/** The label of a control, as a reader hears it, or its own name. */
function labelOf(trigger: HTMLElement | null): string {
  if (trigger === null) return '';

  const labelledBy = trigger.getAttribute('aria-labelledby');
  const named = labelledBy === null ? null : trigger.ownerDocument.getElementById(labelledBy);
  const label = named ?? (trigger as HTMLButtonElement).labels?.[0] ?? null;
  const text = label === null ? '' : spokenText(label);

  return text === '' ? (trigger.getAttribute('aria-label') ?? '') : text;
}
