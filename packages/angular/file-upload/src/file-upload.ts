import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { partitionFiles } from '@slotted/core/files';
import type { FileRejection } from '@slotted/core/files';

export type FileUploadRejection = FileRejection<File>;

/**
 * Holds the selection and applies the restrictions to everything that reaches
 * it, whichever affordance delivered it. `accept` on the input filters the
 * picker's dialog and constrains a drop not at all, so without a check here
 * the component would accept by drop exactly what it refuses by picker.
 */
@Component({
  selector: 'div[slFileUpload]',
  exportAs: 'slFileUpload',
  standalone: true,
  template: '<ng-content />',
  styleUrl: '../../../styles/src/file-upload/file-upload.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-file-upload',
    'data-slotted-component': 'file-upload',
    'data-part': 'root',
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
})
export class SlFileUpload {
  /** The `accept` list, in the syntax the input attribute uses. */
  readonly accept = input('');

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * The largest file accepted, in bytes. A binding rather than an attribute,
   * because absent means no limit and a numeric attribute transform has no way
   * to say that.
   */
  readonly maxSize = input<number | undefined>(undefined);

  readonly multiple = input(false, { transform: booleanAttribute });

  readonly files = model<File[]>([]);

  /** Emits every file refused, and the reason it was refused. */
  readonly reject = output<FileUploadRejection[]>();

  addFiles(incoming: readonly File[]) {
    if (this.disabled()) return;

    const { accepted, rejected } = partitionFiles(incoming, {
      accept: this.accept(),
      maxSize: this.maxSize(),
      multiple: this.multiple(),
    });

    if (rejected.length > 0) this.reject.emit(rejected);
    if (accepted.length === 0) return;

    this.files.set(this.multiple() ? [...this.files(), ...accepted] : accepted);
  }

  removeFile(file: File) {
    this.files.set(this.files().filter((candidate) => candidate !== file));
  }
}
