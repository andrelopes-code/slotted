import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { UploadAdapterLike, UploadFile } from '@slotted/core/upload';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { SlUpload } from './upload';
import { provideUploadDefaults } from './upload-defaults';

function makeFile(name: string, { size = 100, type = '', lastModified = 1 } = {}): File {
  const file = new File(['x'], name, { type, lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

@Component({
  standalone: true,
  imports: [SlUpload],
  template: `
    <div
      #upload="slUpload"
      (reject)="rejected.set($event)"
      [accept]="accept()"
      [adapter]="adapter()"
      [autoUpload]="autoUpload()"
      [multiple]="multiple()"
      slUpload
    ></div>
  `,
})
class Host {
  readonly accept = signal<string | undefined>(undefined);
  readonly adapter = signal<UploadAdapterLike | undefined>(undefined);
  readonly autoUpload = signal(true);
  readonly multiple = signal(false);
  readonly rejected = signal<readonly UploadFile[]>([]);
}

@Component({
  standalone: true,
  imports: [SlUpload],
  template: `<div [messages]="{ trigger: 'Anexar' }" slUpload></div>
    <div size="sm" slUpload></div>`,
})
class Two {}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlUpload],
  template: `<div [adapter]="adapter" [formControl]="control" slUpload></div>`,
})
class FormHost {
  readonly control = new FormControl<readonly UploadFile[]>([]);
  readonly adapter: UploadAdapterLike = () => new Promise(() => undefined);
}

describe('SlUpload', () => {
  let fixture: ComponentFixture<Host>;

  const root = () => fixture.nativeElement.querySelector('[data-ui="upload"]') as HTMLElement;
  const part = (name: string) => root().querySelector(`[data-part="${name}"]`);
  /**
   * The viewer is a layer: `dialog` portals it to the end of the document, so it
   * is not inside the family that opened it. Reading it from the fixture's own
   * element is what a test would do if it believed otherwise.
   */
  const layerPart = (name: string) => document.body.querySelector(`[data-part="${name}"]`);
  const parts = (name: string) => [...root().querySelectorAll(`[data-part="${name}"]`)];
  const input = () => part('input') as HTMLInputElement;

  function choose(files: File[]) {
    Object.defineProperty(input(), 'files', { configurable: true, value: files });
    input().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  async function settle() {
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('is selected in public by the family identifier and its parts', () => {
    expect(root()).toHaveProperty('dataset');
    expect(root().getAttribute('data-ui')).toBe('upload');
    expect(root().getAttribute('data-part')).toBe('root');
    expect(root().getAttribute('data-variant')).toBe('dropzone');
    expect(part('dropzone')).not.toBeNull();
    expect(part('trigger')?.tagName).toBe('LABEL');
    expect(input().type).toBe('file');
  });

  /**
   * The label is around the trigger rather than around the region, so the
   * input's accessible name is three words instead of every word in the box.
   */
  it('puts the control inside the trigger', () => {
    expect(part('trigger')?.contains(input())).toBe(true);
    expect(part('trigger')?.textContent?.trim()).toBe('Browse files');
  });

  it('keeps a refused file in the list with the reason and the sentence', async () => {
    fixture.componentInstance.accept.set('image/*');
    fixture.detectChanges();
    choose([makeFile('report.pdf', { type: 'application/pdf' })]);
    await settle();

    expect(part('item')?.getAttribute('data-status')).toBe('rejected');
    expect(part('message')?.textContent).toContain('This kind of file is not accepted');
    expect(fixture.componentInstance.rejected()[0]?.reason).toBe('type');
  });

  it('appends for a multiple upload and replaces for a single one', async () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    choose([makeFile('one.png', { type: 'image/png' })]);
    await settle();
    choose([makeFile('two.png', { type: 'image/png', lastModified: 2 })]);
    await settle();
    expect(parts('item')).toHaveLength(2);

    fixture.componentInstance.multiple.set(false);
    fixture.detectChanges();
    choose([makeFile('three.png', { type: 'image/png', lastModified: 3 })]);
    await settle();
    expect(parts('item')).toHaveLength(1);
  });

  it('splits a name so the extension survives the truncation', async () => {
    choose([makeFile('quarterly-report.v7.pdf', { type: 'application/pdf' })]);
    await settle();

    expect(part('name')?.textContent).toBe('quarterly-report.v7');
    expect(part('extension')?.textContent).toBe('.pdf');
    expect(part('filename')?.getAttribute('dir')).toBe('auto');
  });

  it('says what kind of file a row holds', async () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    choose([
      makeFile('a.pdf', { type: 'application/pdf' }),
      makeFile('b.xlsx', { lastModified: 2 }),
      makeFile('c.png', { type: 'image/png', lastModified: 3 }),
    ]);
    await settle();

    expect(parts('preview').map((node) => node.getAttribute('data-kind'))).toEqual([
      'pdf',
      'spreadsheet',
      'image',
    ]);
  });

  it('draws the region’s mark, each kind’s mark and each control’s mark as glyphs', async () => {
    const glyph = (node: Element | null) =>
      node
        ?.querySelector(':scope > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph');

    /* The region carries the mark in the dropzone shape, so the trigger does not. */
    expect(glyph(part('dropzone'))).toBe('upload');
    expect(glyph(part('trigger'))).toBeUndefined();

    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.autoUpload.set(false);
    fixture.detectChanges();
    choose([
      makeFile('a.pdf', { type: 'application/pdf' }),
      makeFile('b.xlsx', { lastModified: 2 }),
    ]);
    await settle();
    expect(parts('preview').map(glyph)).toEqual(['file-text', 'file-spreadsheet']);
    const marks: Record<string, string> = {
      cancel: 'x',
      pause: 'pause',
      remove: 'trash',
      retry: 'rotate-ccw',
      start: 'play',
    };
    const controls = parts('actions').flatMap((node) => [...node.children]);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(glyph(control)).toBe(marks[control.getAttribute('data-part') ?? '']);
    }
  });

  describe('the drag', () => {
    const transfer = (items: Array<{ kind: string; type: string }>, files: File[] = []) =>
      ({ files, items, types: ['Files'] }) as unknown as DataTransfer;

    const fire = (name: string, dataTransfer: DataTransfer) => {
      const event = new Event(name, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
      (part('dropzone') as HTMLElement).dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };

    /**
     * `dragenter` and `dragleave` fire for every element the pointer crosses, so
     * clearing on the first leave makes the highlight flicker across the zone.
     */
    it('counts the depth rather than trusting a leave', () => {
      const data = transfer([{ kind: 'file', type: 'image/png' }]);
      fire('dragenter', data);
      fire('dragenter', data);
      fire('dragleave', data);
      expect(root().hasAttribute('data-dragging')).toBe(true);

      fire('dragleave', data);
      expect(root().hasAttribute('data-dragging')).toBe(false);
    });

    /**
     * `DataTransfer.items` gives the kind and the type and neither the name nor
     * the size, so what cannot be known is not judged.
     */
    it('paints a verdict only for the rules a drag can answer', () => {
      fixture.componentInstance.accept.set('image/*');
      fixture.detectChanges();

      fire('dragenter', transfer([{ kind: 'file', type: 'application/pdf' }]));
      expect(part('dropzone')?.hasAttribute('data-drop-invalid')).toBe(true);
      fire('dragleave', transfer([]));

      fire('dragenter', transfer([{ kind: 'file', type: 'image/png' }]));
      expect(part('dropzone')?.hasAttribute('data-drop-target')).toBe(true);
    });

    /** Its default action is to refuse the drop, so it has to be cancelled. */
    it('cancels dragover, or there is no drop at all', () => {
      const event = fire('dragover', transfer([{ kind: 'file', type: 'image/png' }]));
      expect(event.defaultPrevented).toBe(true);
    });

    it('takes a drop and applies the same rules the picker gets', async () => {
      fixture.componentInstance.accept.set('image/*');
      fixture.detectChanges();

      const file = makeFile('note.pdf', { type: 'application/pdf' });
      fire('drop', transfer([{ kind: 'file', type: 'application/pdf' }], [file]));
      await settle();

      expect(part('item')?.getAttribute('data-status')).toBe('rejected');
    });
  });

  describe('the transfer', () => {
    it('sends every accepted file and reports what the adapter resolved with', async () => {
      const send = vi.fn(async () => ({ id: 1 }));
      fixture.componentInstance.adapter.set(send);
      fixture.detectChanges();

      choose([makeFile('a.png', { type: 'image/png' })]);
      await settle();
      await settle();

      expect(send).toHaveBeenCalledOnce();
      expect(part('item')?.getAttribute('data-status')).toBe('success');
    });

    it('leaves a file waiting when the reader starts it themselves', async () => {
      fixture.componentInstance.adapter.set(async () => undefined);
      fixture.componentInstance.autoUpload.set(false);
      fixture.detectChanges();

      choose([makeFile('a.png', { type: 'image/png' })]);
      await settle();
      expect(part('item')?.getAttribute('data-status')).toBe('ready');

      (part('start') as HTMLElement).click();
      await settle();
      await settle();
      expect(part('item')?.getAttribute('data-status')).toBe('success');
    });

    /** A pause control over a sender that cannot suspend is a control that lies. */
    it('draws pause only when the adapter says it honors the handshake', async () => {
      fixture.componentInstance.adapter.set(() => new Promise(() => undefined));
      fixture.detectChanges();
      choose([makeFile('a.png', { type: 'image/png' })]);
      await settle();
      expect(part('pause')).toBeNull();

      fixture.componentInstance.adapter.set({
        send: () => new Promise(() => undefined),
        pausable: true,
      });
      fixture.detectChanges();
      choose([makeFile('b.png', { type: 'image/png', lastModified: 2 })]);
      await settle();
      expect(part('pause')).not.toBeNull();
    });

    it('announces arrivals, failures and the end of the queue', async () => {
      const announce = vi.spyOn(getLiveAnnouncer(document)!, 'announce');
      fixture.componentInstance.adapter.set(async (file: File) => {
        if (file.name === 'b.png') throw new Error('nope');
      });
      fixture.componentInstance.multiple.set(true);
      fixture.detectChanges();

      choose([
        makeFile('a.png', { type: 'image/png' }),
        makeFile('b.png', { type: 'image/png', lastModified: 2 }),
      ]);
      await settle();
      await settle();

      const said = announce.mock.calls.map(([message]) => message);
      expect(said).toContain('2 files added');
      expect(said).toContain('b.png: Failed');
      announce.mockRestore();
    });

    it('takes a row out of the list, and out of the transfer with it', async () => {
      fixture.componentInstance.adapter.set(async () => undefined);
      fixture.detectChanges();
      choose([makeFile('a.png', { type: 'image/png' })]);
      await settle();
      await settle();

      (part('remove') as HTMLElement).click();
      await settle();
      expect(parts('item')).toHaveLength(0);
    });
  });

  it('opens the viewer from the file’s own name', async () => {
    choose([makeFile('a.png', { type: 'image/png' })]);
    await settle();

    const name = part('filename') as HTMLElement;
    expect(name.tagName).toBe('BUTTON');
    name.click();
    fixture.detectChanges();

    const viewer = layerPart('viewer') as HTMLElement;
    expect(viewer).not.toBeNull();
    expect(viewer.closest('[data-ui="upload"]')).toBe(viewer);
    expect(viewer.getAttribute('data-size')).toBe('md');
    expect(layerPart('viewerTitle')?.textContent).toBe('a.png');
    expect(
      layerPart('viewerClose')
        ?.querySelector(':scope > [data-ui="icon"] > svg')
        ?.getAttribute('data-glyph'),
    ).toBe('x');

    (layerPart('viewerClose') as HTMLElement).click();
    fixture.detectChanges();
    expect(layerPart('viewer')).toBeNull();
  });

  /**
   * The layer carries the family's identifier and the family's size, because it
   * is not inside the family: a stylesheet written as a descendant of the root
   * matched nothing there, and the viewer opened with none of its own styles.
   * The dialog owns the surface it stands on, and names it from the title.
   */
  it('draws the viewer on a modal layer that carries the family with it', async () => {
    choose([makeFile('a.png', { type: 'image/png' })]);
    await settle();
    (part('filename') as HTMLElement).click();
    fixture.detectChanges();

    const panel = document.body.querySelector('[data-ui="dialog"] [data-part="content"]');
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBe('true');
    expect(panel?.querySelector('[data-part="viewer"]')).not.toBeNull();

    const title = layerPart('viewerTitle') as HTMLElement;
    expect(panel?.getAttribute('aria-labelledby')).toBe(title.id);
  });

  /** A browser draws neither a spreadsheet nor an archive. */
  it('leaves a file the viewer cannot render as plain text', async () => {
    choose([makeFile('a.xlsx')]);
    await settle();
    expect(part('filename')?.tagName).toBe('SPAN');
  });
});

describe('SlUpload defaults', () => {
  it('lets an application decide once, and an instance decide for itself', async () => {
    await TestBed.configureTestingModule({
      imports: [Two],
      providers: [provideUploadDefaults({ size: 'lg' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(Two);
    fixture.detectChanges();

    const roots = [...fixture.nativeElement.querySelectorAll('[data-ui="upload"]')];
    expect((roots[0] as HTMLElement).getAttribute('data-size')).toBe('lg');
    expect((roots[1] as HTMLElement).getAttribute('data-size')).toBe('sm');
    expect((roots[0] as HTMLElement).querySelector('[data-part="trigger"]')?.textContent).toContain(
      'Anexar',
    );
    expect((roots[1] as HTMLElement).querySelector('[data-part="trigger"]')?.textContent).toContain(
      'Browse files',
    );
  });
});

@Component({
  standalone: true,
  imports: [SlUpload],
  template: `<div
    [clickToBrowse]="browse()"
    [files]="files"
    multiple
    slUpload
    variant="field"
  ></div>`,
})
class Queue {
  readonly browse = signal(true);
  readonly files: readonly UploadFile[] = [stored('a.pdf', 'success'), stored('b.pdf', 'ready')];
}

/** A file that is already in the list, as a server-side record is. */
function stored(name: string, status: UploadFile['status']): UploadFile {
  return { key: name, name, size: 1, type: '', kind: 'pdf', status, loaded: 0, attempts: 0 };
}

describe('SlUpload queue sentences', () => {
  it('marks the region only while a click inside it opens the picker', async () => {
    await TestBed.configureTestingModule({ imports: [Queue] }).compileComponents();
    const fixture = TestBed.createComponent(Queue);
    fixture.detectChanges();
    const zone = () => fixture.nativeElement.querySelector('[data-part="dropzone"]') as HTMLElement;

    expect(zone().hasAttribute('data-browsable')).toBe(true);
    fixture.componentInstance.browse.set(false);
    fixture.detectChanges();
    expect(zone().hasAttribute('data-browsable')).toBe(false);
  });

  it('writes the summary and the field count in the language in force, and follows it', async () => {
    const locale = signal('pt-BR');
    await TestBed.configureTestingModule({
      imports: [Queue],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Queue);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const summary = () => element.querySelector('[data-part="summary"]')?.textContent;
    const meta = () =>
      element.querySelector('[data-part="dropzone"] [data-part="meta"]')?.textContent;

    expect(summary()).toContain('1 de 2 enviados');
    expect(meta()).toContain('2 arquivos');
    expect(element.querySelector('[data-part="remove"]')?.getAttribute('aria-label')).toBe(
      'Remover: a.pdf',
    );

    locale.set('en-US');
    fixture.detectChanges();
    expect(summary()).toContain('1 of 2 uploaded');
    expect(meta()).toContain('2 files');
  });
});

describe('SlUpload in a reactive form', () => {
  /**
   * None of the nine surveyed implementations answers what happens when a form
   * is submitted while the bytes are still moving.
   */
  it('reports the pending transfer to the form, and to the DOM', async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('[data-ui="upload"]') as HTMLElement;
    const input = root.querySelector('[data-part="input"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [makeFile('a.png', { type: 'image/png' })],
    });
    input.dispatchEvent(new Event('change'));
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.control.errors?.['uploadPending']).toBe(true);
    expect(input.validity.customError).toBe(true);
    expect(root.hasAttribute('data-loading')).toBe(true);
  });
});
