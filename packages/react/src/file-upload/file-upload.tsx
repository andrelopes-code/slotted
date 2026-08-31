import '@slotted/styles/file-upload/file-upload.css';

import { partitionFiles } from '@slotted/core/files';
import { useCallback, useMemo, useState } from 'react';

import { FileUploadContext } from './file-upload-context';
import type { FileUploadContextValue, FileUploadProps } from './file-upload.types';

/**
 * Holds the selection and applies the restrictions to everything that reaches
 * it, whichever affordance delivered it. `accept` on the input filters the
 * picker's dialog and constrains a drop not at all, so without a check here
 * the component would accept by drop exactly what it refuses by picker.
 */
export function FileUpload({
  accept = '',
  children,
  className,
  defaultFiles = [],
  disabled = false,
  files,
  maxSize,
  multiple = false,
  onFilesChange,
  onReject,
  ...nativeProps
}: FileUploadProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultFiles);
  const selected = files ?? uncontrolled;

  const commit = useCallback(
    (next: File[]) => {
      if (files === undefined) setUncontrolled(next);
      onFilesChange?.(next);
    },
    [files, onFilesChange],
  );

  const addFiles = useCallback(
    (incoming: readonly File[]) => {
      if (disabled) return;

      const { accepted, rejected } = partitionFiles(incoming, { accept, maxSize, multiple });
      if (rejected.length > 0) onReject?.(rejected);
      if (accepted.length === 0) return;

      commit(multiple ? [...selected, ...accepted] : accepted);
    },
    [accept, commit, disabled, maxSize, multiple, onReject, selected],
  );

  const removeFile = useCallback(
    (file: File) => commit(selected.filter((candidate) => candidate !== file)),
    [commit, selected],
  );

  const context = useMemo<FileUploadContextValue>(
    () => ({ accept, addFiles, disabled, files: selected, multiple, removeFile }),
    [accept, addFiles, disabled, multiple, removeFile, selected],
  );

  return (
    <FileUploadContext.Provider value={context}>
      <div
        {...nativeProps}
        className={['slotted-file-upload', className].filter(Boolean).join(' ')}
        data-disabled={disabled ? '' : undefined}
        data-part="root"
        data-slotted-component="file-upload"
      >
        {children}
      </div>
    </FileUploadContext.Provider>
  );
}
