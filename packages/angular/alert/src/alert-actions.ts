import { Directive } from '@angular/core';

@Directive({
  selector: 'div[slAlertActions]',
  standalone: true,
  host: {
    'data-part': 'actions',
  },
})
export class SlAlertActions {}
