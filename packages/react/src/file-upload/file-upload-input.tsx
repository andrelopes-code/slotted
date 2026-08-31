import type { ChangeEvent } from 'react';

import { useFileUpload } from './file-upload-context';
import type { FileUploadInputProps } from './file-upload.types';

/**
 * The control. It is removed from sight by the stylesheet and from nothing
 * else: the label pairing exists so a reader can reach the picker with the
 * keyboard, which `display: none` would undo.
 *
 * `accept` and `multiple` are written here as well as checked by the root, so
 * the picker's own dialog filters what it offers.
 */
export function FileUploadInput({ onChange, ...nativeProps }: FileUploadInputProps) {
  const upload = useFileUpload();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    upload?.addFiles([...(event.target.files ?? [])]);
  };

  return (
    <input
      accept={upload?.accept === '' ? undefined : upload?.accept}
      disabled={upload?.disabled}
      multiple={upload?.multiple}
      {...nativeProps}
      data-part="input"
      onChange={handleChange}
      type="file"
    />
  );
}
