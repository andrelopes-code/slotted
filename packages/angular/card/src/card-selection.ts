import { Directive } from '@angular/core';

/**
 * The place a choice card keeps for its control: a native checkbox or radio,
 * and `slCheckbox` when the family that owns the check ships it.
 *
 * It is the slot and not the glyph. The card sizes the control from the icon
 * scale density moves, tints the platform's own check with the accent, and
 * centers it on the title's first row; what a check and a dot look like is one
 * decision, and it belongs to `checkbox`.
 *
 * The control inside keeps its own `ControlValueAccessor`, so `[(ngModel)]` and
 * a Reactive Form control both reach it untouched. The card is the `<label>`
 * around it and holds no value of its own.
 */
@Directive({
  selector: '[slCardSelection]',
  standalone: true,
  exportAs: 'slCardSelection',
  host: { 'data-part': 'selection', 'data-part-selection': '' },
})
export class SlCardSelection {}
