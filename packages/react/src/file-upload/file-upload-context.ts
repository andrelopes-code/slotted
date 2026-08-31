import { createContext, useContext } from 'react';

import type { FileUploadContextValue } from './file-upload.types';

export const FileUploadContext = createContext<FileUploadContextValue | undefined>(undefined);

/**
 * The selection, and the two operations on it, for a consumer who lets the
 * component hold it. A consumer who holds it themselves already has both.
 */
export function useFileUpload() {
  return useContext(FileUploadContext);
}
