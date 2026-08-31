import { computed, Directive, inject } from '@angular/core';

import { SlFileUpload } from './file-upload';

/**
 * The control. It is removed from sight by the stylesheet and from nothing
 * else: the label pairing exists so a reader can reach the picker with the
 * keyboard, which `display: none` would undo.
 *
 * `accept` and `multiple` are written here as well as checked by the root, so
 * the picker's own dialog filters what it offers.
 */
@Directive({
  selector: 'input[slFileUploadInput]',
  standalone: true,
  host: {
    type: 'file',
    'data-part': 'input',
    '[attr.accept]': 'accept()',
    '[attr.multiple]': "upload.multiple() ? '' : null",
    '[disabled]': 'upload.disabled()',
    '(change)': 'handleChange($event)',
  },
})
export class SlFileUploadInput {
  protected readonly upload = inject(SlFileUpload);

  protected readonly accept = computed(() => this.upload.accept() || null);

  handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.upload.addFiles([...(input.files ?? [])]);
  }
}
