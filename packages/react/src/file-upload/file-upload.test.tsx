import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileUpload } from './file-upload';
import { useFileUpload } from './file-upload-context';
import { FileUploadDropzone } from './file-upload-dropzone';
import { FileUploadInput } from './file-upload-input';
import { FileUploadItem } from './file-upload-item';
import { FileUploadList } from './file-upload-list';
import type { FileUploadProps } from './file-upload.types';

const png = new File(['x'], 'diagram.png', { type: 'image/png' });
const jpg = new File(['y'], 'photo.jpg', { type: 'image/jpeg' });
const pdf = new File(['zzzzzzzzzz'], 'report.pdf', { type: 'application/pdf' });

function renderUpload(props: Partial<FileUploadProps> = {}) {
  const view = render(
    <FileUpload {...props}>
      <FileUploadDropzone>
        <FileUploadInput />
        <span>Drop files here</span>
      </FileUploadDropzone>
      <FileUploadList />
    </FileUpload>,
  );
  const input = screen.getByLabelText('Drop files here');
  return { ...view, dropzone: input.closest('label')!, input: input as HTMLInputElement };
}

/**
 * A drop carries its files on the event's dataTransfer. jsdom builds no
 * DataTransfer, so the shape the handler reads is supplied directly.
 */
const dropWith = (files: readonly File[]) => ({ dataTransfer: { files, items: files } });

/** Reads the selection through the escape hatch a consumer would use. */
function Selection() {
  const upload = useFileUpload();
  return (
    <output>
      {upload?.files.map((file) => file.name).join(', ')}
      <button onClick={() => upload?.removeFile(upload.files[0]!)} type="button">
        remove
      </button>
    </output>
  );
}

describe('FileUpload', () => {
  it('names the file input with the region that contains it', () => {
    const { input } = renderUpload();
    expect(input).toHaveAttribute('type', 'file');
    expect(input.closest('label')).toHaveAttribute('data-part', 'dropzone');
  });

  it('leaves the control in the tab order, which is why it is a label at all', () => {
    const { input } = renderUpload();
    expect(input).not.toHaveAttribute('hidden');
    expect(input).not.toBeDisabled();
    input.focus();
    expect(input).toHaveFocus();
  });

  it('passes accept and multiple to the input, so the picker filters too', () => {
    const { input } = renderUpload({ accept: 'image/*', multiple: true });
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('multiple');
  });

  it('reports what the picker yielded', () => {
    const onFilesChange = vi.fn();
    const { input } = renderUpload({ onFilesChange });
    fireEvent.change(input, { target: { files: [png] } });
    expect(onFilesChange).toHaveBeenCalledWith([png]);
  });

  it('reports what was dropped on the region', () => {
    const onFilesChange = vi.fn();
    const { dropzone } = renderUpload({ multiple: true, onFilesChange });
    fireEvent.drop(dropzone, dropWith([png, jpg]));
    expect(onFilesChange).toHaveBeenCalledWith([png, jpg]);
  });

  it('applies accept to a drop, which the attribute itself never reaches', () => {
    const onFilesChange = vi.fn();
    const onReject = vi.fn();
    const { dropzone } = renderUpload({
      accept: 'image/*',
      multiple: true,
      onFilesChange,
      onReject,
    });

    fireEvent.drop(dropzone, dropWith([png, pdf]));

    expect(onFilesChange).toHaveBeenCalledWith([png]);
    expect(onReject).toHaveBeenCalledWith([{ file: pdf, reason: 'type' }]);
  });

  it('refuses a file over the size limit and says why', () => {
    const onReject = vi.fn();
    const { dropzone } = renderUpload({ maxSize: 5, multiple: true, onReject });
    fireEvent.drop(dropzone, dropWith([pdf]));
    expect(onReject).toHaveBeenCalledWith([{ file: pdf, reason: 'size' }]);
  });

  it('reports the extras of a single-file upload rather than truncating', () => {
    const onFilesChange = vi.fn();
    const onReject = vi.fn();
    const { dropzone } = renderUpload({ onFilesChange, onReject });

    fireEvent.drop(dropzone, dropWith([png, jpg]));

    expect(onFilesChange).toHaveBeenCalledWith([png]);
    expect(onReject).toHaveBeenCalledWith([{ file: jpg, reason: 'multiple' }]);
  });

  it('adds to a multiple selection and replaces a single one', () => {
    const onFilesChange = vi.fn();
    const { dropzone, rerender } = renderUpload({ files: [png], multiple: true, onFilesChange });
    fireEvent.drop(dropzone, dropWith([jpg]));
    expect(onFilesChange).toHaveBeenLastCalledWith([png, jpg]);

    rerender(
      <FileUpload files={[png]} onFilesChange={onFilesChange}>
        <FileUploadDropzone>
          <FileUploadInput />
          <span>Drop files here</span>
        </FileUploadDropzone>
      </FileUpload>,
    );
    fireEvent.drop(screen.getByText('Drop files here').closest('label')!, dropWith([jpg]));
    expect(onFilesChange).toHaveBeenLastCalledWith([jpg]);
  });

  it('holds the selection itself when the consumer does not', () => {
    render(
      <FileUpload defaultFiles={[png]} multiple>
        <FileUploadDropzone>
          <FileUploadInput />
          <span>Drop files here</span>
        </FileUploadDropzone>
        <Selection />
      </FileUpload>,
    );
    const dropzone = screen.getByText('Drop files here').closest('label')!;
    expect(screen.getByRole('status')).toHaveTextContent('diagram.png');

    fireEvent.drop(dropzone, dropWith([jpg]));
    expect(screen.getByRole('status')).toHaveTextContent('diagram.png, photo.jpg');
  });

  it('gives the consumer a way to take a file back out', () => {
    render(
      <FileUpload defaultFiles={[png, jpg]} multiple>
        <Selection />
      </FileUpload>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    expect(screen.getByRole('status')).toHaveTextContent('photo.jpg');
  });

  it('renders the list and its rows as a list of items', () => {
    render(
      <FileUpload>
        <FileUploadList>
          <FileUploadItem>diagram.png</FileUploadItem>
        </FileUploadList>
      </FileUpload>,
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('data-part', 'item');
  });

  it('still calls the consumer’s own drop handler', () => {
    const onDrop = vi.fn();
    render(
      <FileUpload multiple>
        <FileUploadDropzone onDrop={onDrop}>
          <FileUploadInput />
          <span>Own handler</span>
        </FileUploadDropzone>
      </FileUpload>,
    );
    fireEvent.drop(screen.getByText('Own handler').closest('label')!, dropWith([png]));
    expect(onDrop).toHaveBeenCalledOnce();
  });

  it('does not report a selection it has nothing to report', () => {
    const onFilesChange = vi.fn();
    const onReject = vi.fn();
    const { dropzone } = renderUpload({ accept: 'image/*', onFilesChange, onReject });
    fireEvent.drop(dropzone, dropWith([pdf]));
    expect(onFilesChange).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it('announces the list, because a drop is otherwise silent', () => {
    renderUpload();
    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('FileUploadDropzone', () => {
  it('marks itself while a drag is over it, and stops when it leaves', () => {
    const { dropzone } = renderUpload();
    expect(dropzone).not.toHaveAttribute('data-dragging');

    fireEvent.dragEnter(dropzone, dropWith([png]));
    expect(dropzone).toHaveAttribute('data-dragging', '');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveAttribute('data-dragging');
  });

  it('stays marked while the pointer crosses a child inside it', () => {
    const { dropzone } = renderUpload();

    fireEvent.dragEnter(dropzone, dropWith([png]));
    fireEvent.dragEnter(screen.getByText('Drop files here'), dropWith([png]));
    fireEvent.dragLeave(dropzone);

    expect(dropzone).toHaveAttribute('data-dragging', '');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveAttribute('data-dragging');
  });

  it('clears the mark on drop, since no leave follows one', () => {
    const { dropzone } = renderUpload({ multiple: true });
    fireEvent.dragEnter(dropzone, dropWith([png]));
    fireEvent.drop(dropzone, dropWith([png]));
    expect(dropzone).not.toHaveAttribute('data-dragging');
  });

  it('cancels dragover, without which the browser refuses the drop', () => {
    const { dropzone } = renderUpload();
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    dropzone.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('takes no files while disabled, and marks nothing', () => {
    const onFilesChange = vi.fn();
    const { dropzone } = renderUpload({ disabled: true, onFilesChange });

    fireEvent.dragEnter(dropzone, dropWith([png]));
    expect(dropzone).not.toHaveAttribute('data-dragging');

    fireEvent.drop(dropzone, dropWith([png]));
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it('disables the control it labels, which is what stops the picker', () => {
    const { dropzone, input } = renderUpload({ disabled: true });
    expect(input).toBeDisabled();
    expect(dropzone).toHaveAttribute('data-disabled', '');
  });
});
