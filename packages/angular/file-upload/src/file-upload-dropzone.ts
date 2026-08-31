import { Directive, inject, signal } from '@angular/core';

import { SlFileUpload } from './file-upload';

/**
 * The region, and a `<label>` rather than a div with a role. A label names the
 * control it contains and activates it on click, so the accessible name needs
 * no generated id and the picker needs no handler.
 *
 * Drag and drop is a pointer-only affordance layered on top. The input
 * underneath is the accessible path and is never hidden from the tab order.
 */
@Directive({
  selector: 'label[slFileUploadDropzone]',
  standalone: true,
  host: {
    'data-part': 'dropzone',
    '[attr.data-disabled]': "upload.disabled() ? '' : null",
    '[attr.data-dragging]': "dragging() ? '' : null",
    '(dragenter)': 'handleDragEnter()',
    '(dragleave)': 'handleDragLeave()',
    '(dragover)': 'handleDragOver($event)',
    '(drop)': 'handleDrop($event)',
  },
})
export class SlFileUploadDropzone {
  protected readonly upload = inject(SlFileUpload);

  protected readonly dragging = signal(false);

  /**
   * `dragenter` and `dragleave` fire for every element the pointer crosses, so
   * a drag moving onto a child fires `dragleave` on the region. Counting
   * enters and clearing at nought is what stops the highlight flickering.
   */
  private depth = 0;

  handleDragEnter() {
    if (this.upload.disabled()) return;
    this.depth += 1;
    this.dragging.set(true);
  }

  handleDragLeave() {
    if (this.upload.disabled()) return;
    this.depth = Math.max(this.depth - 1, 0);
    if (this.depth === 0) this.dragging.set(false);
  }

  /**
   * The default action of `dragover` is to refuse the drop, so a handler that
   * does not cancel it gets no `drop` at all and the browser navigates to the
   * dropped file instead.
   */
  handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.depth = 0;
    this.dragging.set(false);
    this.upload.addFiles([...(event.dataTransfer?.files ?? [])]);
  }
}
