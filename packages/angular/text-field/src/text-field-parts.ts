import { writeSelectorKey } from '@slotted/core/selector-key';
import { afterNextRender, Directive, ElementRef, HostAttributeToken, inject } from '@angular/core';

/**
 * An adornment before the value in the reading direction: a currency mark, a
 * unit, an icon, an `@`. Named for the direction rather than for a side, so the
 * same markup puts the mark before the amount in both directions —
 * `docs/component-features.md` §2.4 states the preference and `tag` already
 * ships parts by these names.
 *
 * It is a directive on the consumer's own element, so an `icon`, a `kbd` or a
 * `span` all work and none of them loses its own semantics. The stylesheet
 * sizes any icon inside it from the control's own glyph scale.
 */
@Directive({
  selector: '[slTextFieldStart]',
  standalone: true,
  exportAs: 'slTextFieldStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlTextFieldStart {}

/** An adornment after the value in the reading direction. */
@Directive({
  selector: '[slTextFieldEnd]',
  standalone: true,
  exportAs: 'slTextFieldEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlTextFieldEnd {}

/**
 * A button of the consumer's inside the frame, projected into `start` or
 * `end`: a submit, a menu trigger naming a country, a tooltip on an
 * information mark. Named by `aria-label` it is drawn square, like the
 * family's own buttons; named by its text it takes a step of air a side.
 *
 * `slMenuTriggerFor` on the same element binds `data-part` to `null` outside
 * a bar or a surface, and that binding is a constant, so the part is written
 * back once after the first render and nothing writes over it again — the
 * rule `menu` records for its own trigger. A `type` the consumer wrote wins.
 */
@Directive({
  selector: 'button[slTextFieldAction]',
  standalone: true,
  exportAs: 'slTextFieldAction',
  host: { 'data-part': 'action', 'data-part-action': '', '[attr.type]': 'type' },
})
export class SlTextFieldAction {
  protected readonly type = inject(new HostAttributeToken('type'), { optional: true }) ?? 'button';

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => writeSelectorKey(element, 'part', 'action'));
  }
}
