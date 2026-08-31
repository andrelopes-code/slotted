import fileUploadTokens from '@slotted/styles/file-upload/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_FILE_UPLOAD_TOKENS = fileUploadTokens.map((name) => ({
  name,
  purpose: 'Theme-owned FileUpload decision',
}));

export const REACT_FILE_UPLOAD_DOCS = {
  fileUpload: {
    api: apiRows([
      [
        'accept',
        'string',
        '—',
        'FileUpload',
        'The accept list, in the syntax the input attribute uses. Checked on drop as well',
      ],
      ['files', 'File[]', '—', 'FileUpload', 'The selection, when the consumer holds it'],
      [
        'defaultFiles',
        'File[]',
        '—',
        'FileUpload',
        'The starting selection when the consumer holds none',
      ],
      [
        'onFilesChange',
        '(files: File[]) => void',
        '—',
        'FileUpload',
        'Called with the whole selection each time it changes',
      ],
      ['maxSize', 'number', '—', 'FileUpload', 'The largest file accepted, in bytes'],
      ['multiple', 'boolean', 'false', 'FileUpload', 'Whether more than one file may be held'],
      ['disabled', 'boolean', 'false', 'FileUpload', 'Refuses the picker and the drop alike'],
      [
        'onReject',
        '(rejections: FileUploadRejection[]) => void',
        '—',
        'FileUpload',
        'Called with every refused file and its reason: type, size, or multiple',
      ],
      [
        'useFileUpload',
        '() => FileUploadContextValue | undefined',
        '—',
        'FileUpload',
        'Reads the selection and removes from it, for a consumer who does not hold it',
      ],
    ]),
    accessibility: [
      'The dropzone is a <label> and the input sits inside it, so the region’s text is the input’s accessible name with nothing generated and no aria-labelledby to keep in step. Clicking anywhere in the region opens the picker through native label behaviour.',
      'Keep the region’s visible text short. It is the input’s accessible name, so a paragraph of guidance inside the region is a paragraph read before the control is identified. Put guidance beside the region instead.',
      'The input is removed from sight with the clip technique and from nothing else. display: none and visibility: hidden would take it out of the tab order and the accessibility tree, which is the reason the label pairing exists.',
      'The focus ring is drawn on the region, through :has(:focus-visible). What the reader focuses is a one-pixel invisible input, and a ring around it would outline nothing.',
      'The list of selected files is aria-live="polite". A drop is otherwise silent: the pointer completes an action and nothing tells a screen reader that four files arrived.',
      'Drag and drop is a pointer-only affordance and cannot be made otherwise. It is layered on the region; the input underneath is the accessible path and is never hidden.',
      'Rejections are reported to the consumer rather than announced by the component. What to say about a refused file is a message, and the library does not write messages.',
    ],
    snippets: [
      defineSnippet({
        id: 'file-upload-react-basic',
        language: 'tsx',
        label: 'A region that accepts images by drop and by picker',
        source:
          '<FileUpload accept="image/*" maxSize={5_000_000} multiple onFilesChange={setFiles}>\n  <FileUploadDropzone>\n    <FileUploadInput />\n    <span>Drop images here</span>\n  </FileUploadDropzone>\n  <FileUploadList>\n    {files.map((file) => (\n      <FileUploadItem key={file.name}>{file.name}</FileUploadItem>\n    ))}\n  </FileUploadList>\n</FileUpload>;',
      }),
    ],
  },
  fileUploadDropzone: { api: [], accessibility: [], snippets: [] },
  fileUploadInput: { api: [], accessibility: [], snippets: [] },
  fileUploadList: { api: [], accessibility: [], snippets: [] },
  fileUploadItem: { api: [], accessibility: [], snippets: [] },
} as const;
