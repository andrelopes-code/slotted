import { Directive } from '@angular/core';

@Directive({
  selector: 'span[slStepperLabel]',
  standalone: true,
  host: {
    'data-part': 'label',
  },
})
export class SlStepperLabel {}
