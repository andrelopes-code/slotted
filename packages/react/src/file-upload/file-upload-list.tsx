import type { FileUploadListProps } from './file-upload.types';

/**
 * A drop is otherwise silent: the pointer completes an action and nothing
 * tells a screen reader that four files arrived. Additions announce; the
 * list's initial content does not, which is what a live region already does.
 */
export function FileUploadList(props: FileUploadListProps) {
  return <ul {...props} aria-live="polite" data-part="list" />;
}
