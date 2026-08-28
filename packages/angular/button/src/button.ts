import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { ButtonSize, ButtonTone, ButtonType, ButtonVariant } from './button.constants';

@Component({
  selector: 'button[slButton]',
  standalone: true,
  template: `
    <span data-part="leading"><ng-content select="[slButtonLeading]"></ng-content></span>
    <span data-part="label"><ng-content></ng-content></span>
    <span data-part="trailing"><ng-content select="[slButtonTrailing]"></ng-content></span>
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button',
    'data-slotted-component': 'button',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'disabled() ? "disabled" : null',
    '[disabled]': 'disabled()',
    '[attr.type]': 'type()',
  },
})
export class SlButton {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<ButtonSize>('md');
  readonly tone = input<ButtonTone>('accent');
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>('solid');
}
