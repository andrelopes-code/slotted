import { Directive } from '@angular/core';

@Directive({
  selector: 'legend[slFieldsetLegend]',
  standalone: true,
  host: {
    'data-part': 'legend',
  },
})
export class SlFieldsetLegend {}
