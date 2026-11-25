import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import type { PickerLayer } from './picker-layer';

/** The button that opens the panel, inside the field's end slot. */
@Component({
  selector: 'button[slPickerTrigger]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `
    @if (glyph() === 'clock') {
      <span slIcon><svg slGlyph name="clock"></svg></span>
    } @else {
      <span slIcon><svg slGlyph name="calendar"></svg></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
    'aria-haspopup': 'dialog',
    'data-part': 'trigger',
    'data-part-trigger': '',
    '[attr.aria-controls]': 'layer().isOpen() ? layer().contentId : null',
    '[attr.aria-expanded]': 'layer().isOpen()',
    '[attr.aria-label]': 'label()',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SlPickerTrigger {
  readonly glyph = input.required<'calendar' | 'clock'>();
  readonly label = input.required<string>();
  readonly layer = input.required<PickerLayer>();

  protected onClick(event: Event): void {
    const layer = this.layer();
    if (layer.isOpen()) layer.setOpen(false, 'pointer', event);
    else layer.show('pointer', event);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;

    event.preventDefault();
    this.layer().show('keyboard', event);
  }
}

/** The chord that opens the panel and leaves focus in the field. */
export function isOpenChord(event: KeyboardEvent): boolean {
  return !event.defaultPrevented && event.altKey && event.key === 'ArrowDown';
}
