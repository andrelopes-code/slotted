import { useRef, useState } from 'react';
import type { DragEvent } from 'react';

import { useFileUpload } from './file-upload-context';
import type { FileUploadDropzoneProps } from './file-upload.types';

/**
 * The region, and a `<label>` rather than a div with a role. A label names the
 * control it contains and activates it on click, so the accessible name needs
 * no generated id and the picker needs no handler.
 *
 * Drag and drop is a pointer-only affordance layered on top. The input
 * underneath is the accessible path and is never hidden from the tab order.
 */
export function FileUploadDropzone({
  children,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  ...nativeProps
}: FileUploadDropzoneProps) {
  const upload = useFileUpload();
  const [dragging, setDragging] = useState(false);

  /**
   * `dragenter` and `dragleave` fire for every element the pointer crosses, so
   * a drag moving onto a child fires `dragleave` on the region. Counting
   * enters and clearing at nought is what stops the highlight flickering.
   */
  const depth = useRef(0);

  const disabled = upload?.disabled === true;

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    onDragEnter?.(event);
    if (disabled) return;
    depth.current += 1;
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    onDragLeave?.(event);
    if (disabled) return;
    depth.current = Math.max(depth.current - 1, 0);
    if (depth.current === 0) setDragging(false);
  };

  /**
   * The default action of `dragover` is to refuse the drop, so a handler that
   * does not cancel it gets no `drop` at all and the browser navigates to the
   * dropped file instead.
   */
  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    onDragOver?.(event);
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    onDrop?.(event);
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (disabled) return;
    upload?.addFiles([...(event.dataTransfer?.files ?? [])]);
  };

  return (
    <label
      {...nativeProps}
      data-disabled={disabled ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      data-part="dropzone"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </label>
  );
}
