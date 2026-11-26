import { tabbables } from '@slotted/core/focus';
import '@slotted/styles/picker-panel/picker-panel.css';

import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { FieldContext } from '../field/field-context';
import type { PickerLayer as Layer } from './use-picker-layer';

interface PickerLayerProps {
  readonly children: ReactNode;
  readonly label: string;
  readonly layer: Layer;
  /** Ctrl+Enter, or Cmd+Enter, anywhere in the panel. */
  readonly onApply?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
}

/**
 * The positioned dialog of a picker, moved out of the flow so nothing can clip
 * it. On a phone it is a modal bottom sheet over a scrim.
 */
export function PickerLayer({ children, label, layer, onApply }: PickerLayerProps) {
  if (!layer.mounted) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onApply?.(event);
    }
    if (event.key === 'Tab') wrapTab(event);
  }

  const surface = (
    <div
      data-part="positioner"
      data-part-positioner=""
      data-presentation={layer.sheet ? 'sheet' : 'popover'}
      data-ui="picker-panel"
      data-ui-picker-panel=""
      ref={layer.setLayerNode}
      {...(layer.isOpen ? { 'data-open': '' } : {})}
    >
      {layer.sheet && <div aria-hidden="true" data-part="backdrop" data-part-backdrop="" />}
      <div
        aria-label={label}
        aria-modal={layer.sheet ? true : undefined}
        data-part="content"
        data-part-content=""
        id={layer.contentId}
        onKeyDown={handleKeyDown}
        role="dialog"
      >
        {layer.sheet && <span aria-hidden="true" data-part="grip" data-part-grip="" />}
        {/* The field around the picker names the control, not what is in the panel. */}
        <FieldContext.Provider value={undefined}>{children}</FieldContext.Provider>
      </div>
    </div>
  );

  /* The surface renders in place until the page has an element for it. */
  return layer.container === null ? surface : createPortal(surface, layer.container);
}

/** Tab and Shift+Tab wrap inside the panel while it is open. */
function wrapTab(event: KeyboardEvent<HTMLElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  const items = tabbables(event.currentTarget);
  const [edge, landing] = event.shiftKey ? [items[0], items.at(-1)] : [items.at(-1), items[0]];
  if (landing === undefined || event.currentTarget.ownerDocument.activeElement !== edge) return;

  event.preventDefault();
  landing.focus();
}
