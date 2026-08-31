import { DestroyRef, Directive, inject } from '@angular/core';

import { SlField } from './field';

@Directive({
  selector: 'p[slFieldError]',
  standalone: true,
  host: {
    'data-part': 'error',
    '[attr.id]': 'field.errorId()',
  },
})
export class SlFieldError {
  protected readonly field = inject(SlField);

  constructor() {
    this.field.registerPart('error');
    inject(DestroyRef).onDestroy(() => this.field.releasePart('error'));
  }
}
