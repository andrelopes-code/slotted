import { Directive } from '@angular/core';

/**
 * A drop is otherwise silent: the pointer completes an action and nothing
 * tells a screen reader that four files arrived. Additions announce; the
 * list's initial content does not, which is what a live region already does.
 */
@Directive({
  selector: 'ul[slFileUploadList]',
  standalone: true,
  host: {
    'data-part': 'list',
    'aria-live': 'polite',
  },
})
export class SlFileUploadList {}
