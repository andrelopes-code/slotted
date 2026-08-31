import { Directive } from '@angular/core';

@Directive({
  selector: 'dt[slDescriptionTerm]',
  standalone: true,
  host: {
    'data-part': 'term',
  },
})
export class SlDescriptionTerm {}
