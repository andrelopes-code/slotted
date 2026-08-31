import { Directive, inject } from '@angular/core';

import { SlField } from './field';

@Directive({
  selector: 'label[slFieldLabel]',
  standalone: true,
  host: {
    'data-part': 'label',
    '[attr.for]': 'field.controlId()',
    '[attr.id]': 'field.labelId()',
  },
})
export class SlFieldLabel {
  protected readonly field = inject(SlField);
}
