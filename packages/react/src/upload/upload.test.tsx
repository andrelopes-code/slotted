import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/upload/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Upload } from './upload';
import { UploadDefaultsProvider } from './upload-defaults';
import type { UploadFile, UploadHandle } from './upload.types';

function makeFile(name: string, { size = 100, type = '', lastModified = 1 } = {}): File {
  const file = new File(['x'], name, { type, lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/** A file that is already in the list, as a server-side record is. */
function stored(name: string, status: UploadFile['status']): UploadFile {
  return { key: name, name, size: 1, type: '', kind: 'pdf', status, loaded: 0, attempts: 0 };
}

const root = () => document.querySelector('[data-ui="upload"]') as HTMLElement;
const part = (name: string) => root().querySelector(`[data-part="${name}"]`);
const parts = (name: string) => [...root().querySelectorAll(`[data-part="${name}"]`)];
const input = () => part('input') as HTMLInputElement;

/** The picker's own change, which is the one path a test can take honestly. */
function choose(files: File[]) {
  Object.defineProperty(input(), 'files', { configurable: true, value: files });
  fireEvent.change(input());
}

function drop(files: File[], items = files.map((file) => ({ kind: 'file', type: file.type }))) {
  const zone = part('dropzone') as HTMLElement;
  const dataTransfer = { files, items, types: ['Files'] };
  fireEvent.dragEnter(zone, { dataTransfer });
  fireEvent.dragOver(zone, { dataTransfer });
  fireEvent.drop(zone, { dataTransfer });
}

describe('Upload', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Upload className="page-upload" description="PDF only" label="Documents" />);

    expect(root()).toHaveAttribute('data-ui', 'upload');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveAttribute('data-variant', 'dropzone');
    expect(root()).toHaveClass('page-upload');
    expect(part('label')).toHaveTextContent('Documents');
    expect(part('description')).toHaveTextContent('PDF only');
    expect(part('dropzone')).not.toBeNull();
    expect(part('trigger')?.tagName).toBe('LABEL');
    expect(input().type).toBe('file');
  });

  /**
   * The label is around the trigger rather than around the region, so the
   * input's accessible name is three words instead of every word in the box —
   * and the guidance reaches it as a description instead.
   */
  it('names the control from the trigger and describes it from the guidance', () => {
    render(<Upload description="Up to 10 MB each" />);

    expect(part('trigger')?.contains(input())).toBe(true);
    expect(input()).toHaveAccessibleName('Browse files');
    expect(input()).toHaveAccessibleDescription('Up to 10 MB each');
  });

  it('keeps a refused file in the list with the reason and the sentence', () => {
    const onReject = vi.fn();
    render(<Upload accept="image/*" onReject={onReject} />);

    choose([makeFile('report.pdf', { type: 'application/pdf' })]);

    const item = part('item') as HTMLElement;
    expect(item).toHaveAttribute('data-status', 'rejected');
    expect(part('message')).toHaveTextContent('This kind of file is not accepted');
    expect(onReject).toHaveBeenCalledOnce();
    expect(onReject.mock.calls[0]?.[0][0].reason).toBe('type');
  });

  it('appends for a multiple upload and replaces for a single one', () => {
    const { rerender } = render(<Upload multiple />);
    choose([makeFile('one.png', { type: 'image/png' })]);
    choose([makeFile('two.png', { type: 'image/png', lastModified: 2 })]);
    expect(parts('item')).toHaveLength(2);

    rerender(<Upload />);
    choose([makeFile('three.png', { type: 'image/png', lastModified: 3 })]);
    expect(parts('item')).toHaveLength(1);
  });

  it('splits a name so the extension survives the truncation', () => {
    render(<Upload />);
    choose([makeFile('quarterly-report.v7.pdf', { type: 'application/pdf' })]);

    expect(part('name')).toHaveTextContent('quarterly-report.v7');
    expect(part('extension')).toHaveTextContent('.pdf');
    expect(part('filename')).toHaveAttribute('dir', 'auto');
  });

  it('says what kind of file a row holds', () => {
    render(<Upload multiple />);
    choose([
      makeFile('a.pdf', { type: 'application/pdf' }),
      makeFile('b.xlsx', { lastModified: 2 }),
      makeFile('c.png', { type: 'image/png', lastModified: 3 }),
    ]);

    expect(parts('preview').map((node) => node.getAttribute('data-kind'))).toEqual([
      'pdf',
      'spreadsheet',
      'image',
    ]);
  });

  it('draws the region’s mark, each kind’s mark and each control’s mark as glyphs', () => {
    const glyph = (node: Element | null) =>
      node
        ?.querySelector(':scope > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph');
    const { unmount } = render(<Upload multiple />);

    /* The region carries the mark in the dropzone shape, so the trigger does not. */
    expect(glyph(part('dropzone'))).toBe('upload');
    expect(glyph(part('trigger'))).toBeUndefined();

    choose([
      makeFile('a.pdf', { type: 'application/pdf' }),
      makeFile('b.xlsx', { lastModified: 2 }),
    ]);
    expect(parts('preview').map(glyph)).toEqual(['file-text', 'file-spreadsheet']);
    const marks = {
      cancel: 'x',
      pause: 'pause',
      remove: 'trash',
      retry: 'rotate-ccw',
      start: 'play',
    };
    const controls = parts('actions').flatMap((node) => [...node.children]);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      const name = control.getAttribute('data-part') as keyof typeof marks;
      expect(glyph(control)).toBe(marks[name]);
    }
    unmount();

    render(<Upload variant="button" />);
    expect(glyph(part('trigger'))).toBe('upload');
  });

  describe('the drag', () => {
    /**
     * `dragenter` and `dragleave` fire for every element the pointer crosses. A
     * drag moving onto a child fires `dragleave` on the region, and clearing the
     * state there makes the highlight flicker across the whole zone.
     */
    it('counts the depth rather than trusting a leave', () => {
      render(<Upload />);
      const zone = part('dropzone') as HTMLElement;
      const dataTransfer = {
        files: [],
        items: [{ kind: 'file', type: 'image/png' }],
        types: ['Files'],
      };

      fireEvent.dragEnter(zone, { dataTransfer });
      fireEvent.dragEnter(zone, { dataTransfer });
      fireEvent.dragLeave(zone, { dataTransfer });
      expect(root()).toHaveAttribute('data-dragging');

      fireEvent.dragLeave(zone, { dataTransfer });
      expect(root()).not.toHaveAttribute('data-dragging');
    });

    /**
     * `DataTransfer.items` gives the kind and the type and neither the name nor
     * the size. Three rules are answerable before the drop and two are not: what
     * cannot be known is not judged.
     */
    it('paints a verdict only for the rules a drag can answer', () => {
      render(<Upload accept="image/*" maxSize={10} />);
      const zone = part('dropzone') as HTMLElement;

      fireEvent.dragEnter(zone, {
        dataTransfer: { items: [{ kind: 'file', type: 'application/pdf' }], types: ['Files'] },
      });
      expect(zone).toHaveAttribute('data-drop-invalid');
      fireEvent.dragLeave(zone, { dataTransfer: { items: [], types: ['Files'] } });

      /* Too large, and it says nothing: the size is not knowable yet. */
      fireEvent.dragEnter(zone, {
        dataTransfer: { items: [{ kind: 'file', type: 'image/png' }], types: ['Files'] },
      });
      expect(zone).toHaveAttribute('data-drop-target');
      expect(zone).not.toHaveAttribute('data-drop-invalid');
    });

    it('takes a drop and applies the same rules the picker gets', () => {
      render(<Upload accept="image/*" />);
      drop([makeFile('note.pdf', { type: 'application/pdf' })]);

      expect(part('item')).toHaveAttribute('data-status', 'rejected');
    });

    it('runs the consumer’s own handler before it acts', () => {
      const onDrop = vi.fn();
      render(<Upload onDrop={onDrop} />);
      drop([makeFile('a.png', { type: 'image/png' })]);

      expect(onDrop).toHaveBeenCalledOnce();
      expect(parts('item')).toHaveLength(1);
    });
  });

  describe('the transfer', () => {
    it('sends every accepted file and reports what the adapter resolved with', async () => {
      const send = vi.fn(async () => ({ id: 1 }));
      const onFilesChange = vi.fn();
      render(<Upload adapter={send} multiple onFilesChange={onFilesChange} />);

      choose([makeFile('a.png', { type: 'image/png' })]);
      await waitFor(() => expect(part('item')).toHaveAttribute('data-status', 'success'));
      expect(send).toHaveBeenCalledOnce();
    });

    it('leaves a file waiting when the reader starts it themselves', async () => {
      render(<Upload adapter={async () => undefined} autoUpload={false} />);
      choose([makeFile('a.png', { type: 'image/png' })]);

      expect(part('item')).toHaveAttribute('data-status', 'ready');
      expect(part('start')).not.toBeNull();

      fireEvent.click(part('start') as HTMLElement);
      await waitFor(() => expect(part('item')).toHaveAttribute('data-status', 'success'));
    });

    it('offers a failed row a retry, and nothing else offers one', async () => {
      let attempts = 0;
      render(
        <Upload
          adapter={async () => {
            attempts += 1;
            if (attempts === 1) throw new Error('nope');
          }}
        />,
      );

      choose([makeFile('a.png', { type: 'image/png' })]);
      await waitFor(() => expect(part('item')).toHaveAttribute('data-status', 'error'));
      expect(part('retry')).not.toBeNull();

      fireEvent.click(part('retry') as HTMLElement);
      await waitFor(() => expect(part('item')).toHaveAttribute('data-status', 'success'));
    });

    /**
     * A pause control over a sender that cannot suspend is a control that lies,
     * so the handshake is the adapter's to accept.
     */
    it('draws pause only when the adapter says it honors the handshake', async () => {
      const hold = () => new Promise(() => undefined);
      const { rerender } = render(<Upload adapter={hold} />);
      choose([makeFile('a.png', { type: 'image/png' })]);
      await waitFor(() => expect(part('item')).toHaveAttribute('data-status', 'uploading'));
      expect(part('pause')).toBeNull();

      rerender(<Upload adapter={{ send: hold, pausable: true }} />);
      choose([makeFile('b.png', { type: 'image/png', lastModified: 2 })]);
      await waitFor(() => expect(part('pause')).not.toBeNull());
    });

    it('takes a row out of the list, and out of the transfer with it', async () => {
      render(<Upload adapter={async () => undefined} />);
      choose([makeFile('a.png', { type: 'image/png' })]);
      await waitFor(() => expect(part('remove')).not.toBeNull());

      fireEvent.click(part('remove') as HTMLElement);
      expect(parts('item')).toHaveLength(0);
    });
  });

  describe('what the queue says', () => {
    it('marks the region only while a click inside it opens the picker', () => {
      const { rerender } = render(<Upload />);
      expect(part('dropzone')).toHaveAttribute('data-browsable');

      rerender(<Upload clickToBrowse={false} />);
      expect(part('dropzone')).not.toHaveAttribute('data-browsable');

      rerender(<Upload disabled />);
      expect(part('dropzone')).not.toHaveAttribute('data-browsable');
    });

    it('writes the summary and the field count in the catalog, and in its own messages', () => {
      const files = [stored('a.pdf', 'success'), stored('b.pdf', 'ready')];
      const { rerender } = render(<Upload defaultFiles={files} multiple variant="field" />);

      expect(part('summary')).toHaveTextContent('1 of 2 uploaded');
      expect(part('meta')).toHaveTextContent('2 files');

      rerender(
        <Upload
          defaultFiles={files}
          messages={{ selection: 'queue:{count}', summary: 'queue:{uploaded}/{total}' }}
          multiple
          variant="field"
        />,
      );
      expect(part('summary')).toHaveTextContent('queue:1/2');
      expect(part('meta')).toHaveTextContent('queue:2');
    });

    it('announces arrivals, failures and the end of the queue, in the provider’s words', async () => {
      const announce = vi.spyOn(getLiveAnnouncer(document), 'announce');
      render(
        <Upload
          adapter={async (file) => {
            if (file.name === 'b.png') throw new Error('nope');
          }}
          multiple
        />,
      );

      choose([
        makeFile('a.png', { type: 'image/png' }),
        makeFile('b.png', { type: 'image/png', lastModified: 2 }),
      ]);

      await waitFor(() => expect(parts('item')[1]).toHaveAttribute('data-status', 'error'));
      const said = announce.mock.calls.map(([message]) => message);
      expect(said).toContain('2 files added');
      expect(said).toContain('b.png: Failed');
      announce.mockRestore();
    });
  });

  /**
   * None of the nine surveyed implementations answers what happens when a form
   * is submitted while the bytes are still moving.
   */
  it('makes the control invalid while a transfer is pending', async () => {
    render(<Upload adapter={() => new Promise(() => undefined)} />);
    choose([makeFile('a.png', { type: 'image/png' })]);

    await waitFor(() => expect(input().validity.customError).toBe(true));
    expect(input().validationMessage).toBe('Wait for the files to finish uploading.');
  });

  it('opens the viewer from the file’s own name, and closes it again', async () => {
    render(<Upload />);
    choose([makeFile('a.png', { type: 'image/png' })]);

    const name = part('filename') as HTMLElement;
    expect(name.tagName).toBe('BUTTON');
    fireEvent.click(name);

    await waitFor(() => expect(document.querySelector('[data-part="viewer"]')).not.toBeNull());
    expect(document.querySelector('[data-part="viewerTitle"]')).toHaveTextContent('a.png');

    /*
     * The layer is portalled out of the family, so it carries the family with
     * it: a stylesheet written as a descendant of the root matched nothing
     * there, and the viewer opened with none of its own styles.
     */
    const viewer = document.querySelector('[data-part="viewer"]') as HTMLElement;
    expect(viewer.closest('[data-ui="upload"]')).toBe(viewer);
    expect(viewer).toHaveAttribute('data-size', 'md');
    const panel = viewer.closest('[data-ui="dialog"] [data-part="content"]');
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(panel).toHaveAccessibleName('a.png');

    expect(
      document.querySelector('[data-part="viewerClose"] > [data-ui="icon"] > svg[data-glyph="x"]'),
    ).not.toBeNull();
    fireEvent.click(document.querySelector('[data-part="viewerClose"]') as HTMLElement);
    await waitFor(() => expect(document.querySelector('[data-part="viewer"]')).toBeNull());
  });

  /** A browser draws neither a spreadsheet nor an archive. */
  it('leaves a file the viewer cannot render as plain text', () => {
    render(<Upload />);
    choose([makeFile('a.xlsx')]);

    expect(part('filename')?.tagName).toBe('SPAN');
  });

  it('lets an application decide once, and an instance decide for itself', () => {
    render(
      <UploadDefaultsProvider size="lg">
        <Upload messages={{ trigger: 'Anexar' }} />
        <Upload data-testid="own" size="sm" />
      </UploadDefaultsProvider>,
    );

    const roots = [...document.querySelectorAll('[data-ui="upload"]')];
    expect(roots[0]).toHaveAttribute('data-size', 'lg');
    expect(roots[1]).toHaveAttribute('data-size', 'sm');
    expect(roots[0]?.querySelector('[data-part="trigger"]')).toHaveTextContent('Anexar');
    expect(roots[1]?.querySelector('[data-part="trigger"]')).toHaveTextContent('Browse files');
  });

  it('speaks the language in force: the controls, the reason a file was refused, its size', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Upload maxSize={1000} />
      </SlottedProvider>,
    );
    choose([makeFile('grande.pdf', { size: 1_500_000, type: 'application/pdf' })]);

    expect(input()).toHaveAccessibleName('Procurar arquivos');
    expect(part('status')).toHaveTextContent('Recusado');
    // language: pt-BR
    expect(part('message')).toHaveTextContent('Este arquivo tem 1,5 MB e é grande demais.');
    // language: en-US
    expect(screen.getByRole('button', { name: 'Remover: grande.pdf' })).toBeVisible();
  });

  /**
   * A field owns the label row, the description and the error slot for every
   * control in this library. Two labels on one control is what a form gets
   * otherwise.
   */
  it('gives the field back what the field owns', () => {
    render(
      <Field>
        <FieldLabel>Proof of ownership</FieldLabel>
        <Upload description="never drawn" label="never drawn" />
      </Field>,
    );

    expect(part('label')).toBeNull();
    expect(part('description')).toBeNull();
    expect(screen.getByText('Proof of ownership')).not.toBeNull();
  });

  it('reaches the five actions a consumer cannot write declaratively', async () => {
    const handle = createRef<UploadHandle>();
    render(
      <Upload adapter={async () => undefined} autoUpload={false} handleRef={handle} multiple />,
    );

    choose([makeFile('a.png', { type: 'image/png' })]);
    expect(part('item')).toHaveAttribute('data-status', 'ready');

    handle.current?.upload();
    await waitFor(() => expect(part('item')).toHaveAttribute('data-status', 'success'));

    handle.current?.clear();
    await waitFor(() => expect(parts('item')).toHaveLength(0));
  });

  it('draws every state the contract declares in the DOM', async () => {
    render(<Upload adapter={() => new Promise(() => undefined)} disabled />);
    expect(root()).toHaveAttribute('data-disabled');

    for (const attribute of Object.values(contract.stateAttributes)) {
      expect(typeof attribute).toBe('string');
    }
  });

  it('lets the consumer own the selection', () => {
    const onFilesChange = vi.fn();
    const held = [
      {
        key: 'k',
        name: 'held.pdf',
        size: 10,
        type: 'application/pdf',
        kind: 'pdf' as const,
        status: 'success' as const,
        loaded: 10,
        attempts: 1,
      },
    ];
    render(<Upload files={held} onFilesChange={onFilesChange} />);

    expect(part('name')).toHaveTextContent('held');
    fireEvent.click(part('remove') as HTMLElement);

    /* Controlled: it asks, and the list does not move until the consumer moves it. */
    expect(onFilesChange).toHaveBeenCalledOnce();
    expect(onFilesChange.mock.calls[0]?.[1].reason).toBe('remove');
    expect(part('name')).toHaveTextContent('held');
  });
});
