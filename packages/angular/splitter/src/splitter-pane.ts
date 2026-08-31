import { Directive } from '@angular/core';

@Directive({
  selector: 'div[slSplitterPane]',
  standalone: true,
  host: {
    'data-part': 'pane',
  },
})
export class SlSplitterPane {}
