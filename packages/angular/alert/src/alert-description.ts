import { Directive } from '@angular/core';

@Directive({
  selector: 'p[slAlertDescription]',
  standalone: true,
  host: {
    'data-part': 'description',
  },
})
export class SlAlertDescription {}
