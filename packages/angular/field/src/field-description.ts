import { DestroyRef, Directive, inject } from '@angular/core';

import { SlField } from './field';

@Directive({
  selector: 'p[slFieldDescription]',
  standalone: true,
  host: {
    'data-part': 'description',
    '[attr.id]': 'field.descriptionId()',
  },
})
export class SlFieldDescription {
  protected readonly field = inject(SlField);

  constructor() {
    this.field.registerPart('description');
    inject(DestroyRef).onDestroy(() => this.field.releasePart('description'));
  }
}
