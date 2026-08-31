import { Directive } from '@angular/core';

@Directive({
  selector: 'div[slAlertTitle]',
  standalone: true,
  host: {
    'data-part': 'title',
  },
})
export class SlAlertTitle {}
