import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

export type FieldsetOrientation = 'vertical' | 'horizontal';

/**
 * A group of related fields, named by its legend.
 *
 * Both the `group` role and the accessible name come from the elements
 * themselves, so no ARIA is added. `disabled` is the native attribute, which
 * disables every control inside — nothing is passed down and nothing has to
 * reproduce it.
 */
@Component({
  selector: 'fieldset[slFieldset]',
  standalone: true,
  template: '<ng-content />',
  styleUrl: '../../../styles/src/fieldset/fieldset.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-fieldset',
    'data-slotted-component': 'fieldset',
    'data-part': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-invalid]': "invalid() ? '' : null",
    '[attr.disabled]': "disabled() ? '' : null",
  },
})
export class SlFieldset {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly orientation = input<FieldsetOrientation>('vertical');
}
