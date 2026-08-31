import type { FileUploadItemProps } from './file-upload.types';

export function FileUploadItem(props: FileUploadItemProps) {
  return <li {...props} data-part="item" />;
}
