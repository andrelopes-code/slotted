import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { BUTTON_DEFAULTS_TOKEN } from '@slotted/angular/button';
import type {
  ButtonDefaults,
  ButtonSize,
  ButtonTone,
  ButtonVariant,
} from '@slotted/angular/button';

import type {
  ButtonGroupAlign,
  ButtonGroupJustify,
  ButtonGroupOrientation,
} from './button-group.types';

/**
 * The three axes the group hands down to the buttons inside it, through the
 * button family's own defaults token rather than through a second channel of
 * this family's invention. That is what keeps an explicit input on a button
 * winning over the group, because it is the rule `button` already implements.
 *
 * The value is read through getters so that a button's `computed` tracks the
 * group's signals: a plain snapshot would fix the paint at the moment the
 * first button was created and never move again.
 */
function provideGroupPaint() {
  return {
    provide: BUTTON_DEFAULTS_TOKEN,
    useFactory: (): ButtonDefaults => {
      const group = inject(SlButtonGroup);
      const inherited = inject(BUTTON_DEFAULTS_TOKEN, { skipSelf: true });

      return {
        get size() {
          return group.size() ?? inherited.size;
        },
        get tone() {
          return group.tone() ?? inherited.tone;
        },
        get variant() {
          return group.variant() ?? inherited.variant;
        },
      };
    },
  };
}

/**
 * A set of related actions joined into one shape. The group arranges what the
 * consumer wrote and changes the semantics of nothing inside it: every button
 * keeps its own role, its own state and its own place in the tab sequence.
 *
 * One shape and no other: the buttons share their edges, one border is painted
 * in each shared column, and only the two ends of the bar are rounded. There
 * is no input that spaces the buttons apart and none that unjoins them — a
 * spaced row of buttons is `slInline` or `slStack` holding buttons.
 *
 * It is `role="group"` and not `role="toolbar"`, and the difference is a
 * keyboard model rather than a name. A toolbar is one tab stop with arrow-key
 * navigation between its controls, which is the `toolbar` family. A consumer
 * who wrote `role` on the element keeps it, read before the host binding is
 * written, so the role and the model are never confused by accident.
 *
 * There is no `label` input. The element already accepts `aria-label` and
 * `aria-labelledby`, and a second way to name one thing is a second thing to
 * get wrong.
 */
@Component({
  selector: '[slButtonGroup]',
  standalone: true,
  exportAs: 'slButtonGroup',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/button-group/button-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [provideGroupPaint()],
  host: {
    'data-ui': 'button-group',
    'data-ui-button-group': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role',
    '[attr.data-orientation]': 'orientation() ?? null',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-justify]': 'justify() ?? null',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
  },
})
export class SlButtonGroup {
  /** Positions the buttons across the flow. */
  readonly align = input<ButtonGroupAlign>();
  /** Positions the buttons along the flow, which makes the group hold the line. */
  readonly justify = input<ButtonGroupJustify>();
  readonly orientation = input<ButtonGroupOrientation>();
  /** The group holds the line and its buttons share it in equal segments. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  readonly size = input<ButtonSize | undefined>(undefined);
  readonly tone = input<ButtonTone | undefined>(undefined);
  readonly variant = input<ButtonVariant | undefined>(undefined);

  /**
   * A static attribute the consumer wrote survives the host binding, which is
   * how `role="toolbar"` stays possible on an element this family would
   * otherwise call a group.
   *
   * `role=""` is the way out: ARIA reads an empty role as "use the element's
   * implicit one", so a `nav` or a `section` carrying this directive keeps the
   * semantics it was chosen for instead of being flattened to a group.
   */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  protected readonly role = this.writtenRole === '' ? null : (this.writtenRole ?? 'group');

  /** What the rule between two runs turns with. */
  readonly flow = computed(() => this.orientation() ?? 'horizontal');
}
