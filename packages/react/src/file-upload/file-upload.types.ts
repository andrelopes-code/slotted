import type { FileRejection } from '@slotted/core/files';
import type { ComponentPropsWithoutRef } from 'react';

export type FileUploadRejection = FileRejection<File>;

export interface FileUploadContextValue {
  accept: string;
  addFiles: (incoming: readonly File[]) => void;
  disabled: boolean;
  files: readonly File[];
  multiple: boolean;
  removeFile: (file: File) => void;
}

export interface FileUploadProps extends ComponentPropsWithoutRef<'div'> {
  /** The `accept` list, in the syntax the input attribute uses. */
  accept?: string;
  /** The starting selection when the consumer holds none. */
  defaultFiles?: File[];
  disabled?: boolean;
  /** The selection, when the consumer holds it. */
  files?: File[];
  /** The largest file accepted, in bytes. */
  maxSize?: number;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  /** Called with every file refused, and the reason it was refused. */
  onReject?: (rejections: FileUploadRejection[]) => void;
}

export type FileUploadDropzoneProps = ComponentPropsWithoutRef<'label'>;
export type FileUploadInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>;
export type FileUploadListProps = ComponentPropsWithoutRef<'ul'>;
export type FileUploadItemProps = ComponentPropsWithoutRef<'li'>;
