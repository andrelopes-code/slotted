import type { KeyboardEvent, ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import type { PickerLayer } from './use-picker-layer';

interface PickerTriggerProps {
  /** The value in words, where the trigger is the whole frame. */
  readonly children?: ReactNode;
  readonly disabled: boolean;
  readonly glyph: 'calendar' | 'clock';
  readonly label: string;
  readonly layer: PickerLayer;
}

/** The button that opens the panel: in the field's end slot, or as the frame. */
export function PickerTrigger({ children, disabled, glyph, label, layer }: PickerTriggerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;

    event.preventDefault();
    layer.show('keyboard', event);
  }

  return (
    <button
      aria-controls={layer.isOpen ? layer.contentId : undefined}
      aria-expanded={layer.isOpen}
      aria-haspopup="dialog"
      aria-label={label}
      data-part="trigger"
      data-part-trigger=""
      disabled={disabled}
      onClick={(event) => {
        if (layer.isOpen) layer.setOpen(false, 'pointer', event);
        else layer.show('pointer', event);
      }}
      onKeyDown={handleKeyDown}
      ref={layer.triggerRef}
      type="button"
    >
      {children}
      <Icon>
        <Glyph name={glyph} />
      </Icon>
    </button>
  );
}

/** The chord that opens the panel and leaves focus in the field. */
export function isOpenChord(event: KeyboardEvent<HTMLElement>): boolean {
  return !event.defaultPrevented && event.altKey && event.key === 'ArrowDown';
}
