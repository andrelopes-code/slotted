import { Directive } from '@angular/core';

@Directive({
  selector: 'li[slFileUploadItem]',
  standalone: true,
  host: {
    'data-part': 'item',
  },
})
export class SlFileUploadItem {}
