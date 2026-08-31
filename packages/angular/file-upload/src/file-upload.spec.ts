import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { SlFileUpload } from './file-upload';
import type { FileUploadRejection } from './file-upload';
import { SlFileUploadDropzone } from './file-upload-dropzone';
import { SlFileUploadInput } from './file-upload-input';
import { SlFileUploadItem } from './file-upload-item';
import { SlFileUploadList } from './file-upload-list';

const png = new File(['x'], 'diagram.png', { type: 'image/png' });
const jpg = new File(['y'], 'photo.jpg', { type: 'image/jpeg' });
const pdf = new File(['zzzzzzzzzz'], 'report.pdf', { type: 'application/pdf' });

@Component({
  imports: [
    SlFileUpload,
    SlFileUploadDropzone,
    SlFileUploadInput,
    SlFileUploadItem,
    SlFileUploadList,
  ],
  template: `
    <div
      slFileUpload
      id="upload"
      [accept]="accept()"
      [disabled]="disabled()"
      [maxSize]="maxSize()"
      [multiple]="multiple()"
      [(files)]="files"
      (reject)="rejected.set($event)"
    >
      <label slFileUploadDropzone>
        <input slFileUploadInput />
        <span>Drop files here</span>
      </label>
      <ul slFileUploadList>
        @for (file of files(); track file.name) {
          <li slFileUploadItem>{{ file.name }}</li>
        }
      </ul>
    </div>
  `,
})
class Host {
  readonly accept = signal('');
  readonly disabled = signal(false);
  readonly files = signal<File[]>([]);
  readonly maxSize = signal<number | undefined>(undefined);
  readonly multiple = signal(false);
  readonly rejected = signal<FileUploadRejection[]>([]);
}

/**
 * A drop carries its files on the event's dataTransfer. jsdom builds no
 * DataTransfer, so the shape the handler reads is supplied directly.
 */
function dragEvent(type: string, files: readonly File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  return event;
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    dropzone: element.querySelector<HTMLLabelElement>('[data-part="dropzone"]')!,
    fixture,
    host: fixture.componentInstance,
    input: element.querySelector<HTMLInputElement>('[data-part="input"]')!,
    items: () => [...element.querySelectorAll<HTMLElement>('[data-part="item"]')],
    list: element.querySelector<HTMLElement>('[data-part="list"]')!,
    send: (type: string, target: EventTarget, files: readonly File[] = []) => {
      const event = dragEvent(type, files);
      target.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    },
  };
}

describe('SlFileUpload', () => {
  it('names the file input with the region that contains it', () => {
    const { dropzone, input } = mount();
    expect(input.type).toBe('file');
    expect(input.closest('label')).toBe(dropzone);
  });

  it('leaves the control in the tab order, which is why it is a label at all', () => {
    const { input } = mount();
    expect(input.disabled).toBe(false);
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('passes accept and multiple to the input, so the picker filters too', () => {
    const { fixture, host, input } = mount();
    host.accept.set('image/*');
    host.multiple.set(true);
    fixture.detectChanges();
    expect(input.getAttribute('accept')).toBe('image/*');
    expect(input.hasAttribute('multiple')).toBe(true);
  });

  it('reports what was dropped on the region', () => {
    const { fixture, host, send, dropzone } = mount();
    host.multiple.set(true);
    fixture.detectChanges();

    send('drop', dropzone, [png, jpg]);

    expect(host.files()).toEqual([png, jpg]);
  });

  it('applies accept to a drop, which the attribute itself never reaches', () => {
    const { fixture, host, send, dropzone } = mount();
    host.accept.set('image/*');
    host.multiple.set(true);
    fixture.detectChanges();

    send('drop', dropzone, [png, pdf]);

    expect(host.files()).toEqual([png]);
    expect(host.rejected()).toEqual([{ file: pdf, reason: 'type' }]);
  });

  it('refuses a file over the size limit and says why', () => {
    const { fixture, host, send, dropzone } = mount();
    host.maxSize.set(5);
    host.multiple.set(true);
    fixture.detectChanges();

    send('drop', dropzone, [pdf]);

    expect(host.files()).toEqual([]);
    expect(host.rejected()).toEqual([{ file: pdf, reason: 'size' }]);
  });

  it('reports the extras of a single-file upload rather than truncating', () => {
    const { host, send, dropzone } = mount();
    send('drop', dropzone, [png, jpg]);
    expect(host.files()).toEqual([png]);
    expect(host.rejected()).toEqual([{ file: jpg, reason: 'multiple' }]);
  });

  it('adds to a multiple selection and replaces a single one', () => {
    const { fixture, host, send, dropzone } = mount();
    host.multiple.set(true);
    host.files.set([png]);
    fixture.detectChanges();
    send('drop', dropzone, [jpg]);
    expect(host.files()).toEqual([png, jpg]);

    host.multiple.set(false);
    host.files.set([png]);
    fixture.detectChanges();
    send('drop', dropzone, [jpg]);
    expect(host.files()).toEqual([jpg]);
  });

  it('gives the consumer a way to take a file back out', () => {
    const { fixture, host, items } = mount();
    host.multiple.set(true);
    host.files.set([png, jpg]);
    fixture.detectChanges();
    expect(items()).toHaveLength(2);

    fixture.debugElement.query(By.directive(SlFileUpload)).componentInstance.removeFile(png);
    fixture.detectChanges();

    expect(host.files()).toEqual([jpg]);
  });

  it('announces the list, because a drop is otherwise silent', () => {
    const { list } = mount();
    expect(list.getAttribute('aria-live')).toBe('polite');
  });
});

describe('SlFileUploadDropzone', () => {
  it('marks itself while a drag is over it, and stops when it leaves', () => {
    const { dropzone, send } = mount();
    expect(dropzone.hasAttribute('data-dragging')).toBe(false);

    send('dragenter', dropzone, [png]);
    expect(dropzone.getAttribute('data-dragging')).toBe('');

    send('dragleave', dropzone);
    expect(dropzone.hasAttribute('data-dragging')).toBe(false);
  });

  it('stays marked while the pointer crosses a child inside it', () => {
    const { dropzone, send } = mount();
    const child = dropzone.querySelector('span')!;

    send('dragenter', dropzone, [png]);
    send('dragenter', child, [png]);
    send('dragleave', dropzone);
    expect(dropzone.getAttribute('data-dragging')).toBe('');

    send('dragleave', dropzone);
    expect(dropzone.hasAttribute('data-dragging')).toBe(false);
  });

  it('clears the mark on drop, since no leave follows one', () => {
    const { dropzone, send } = mount();
    send('dragenter', dropzone, [png]);
    send('drop', dropzone, [png]);
    expect(dropzone.hasAttribute('data-dragging')).toBe(false);
  });

  it('cancels dragover, without which the browser refuses the drop', () => {
    const { dropzone, send } = mount();
    expect(send('dragover', dropzone).defaultPrevented).toBe(true);
  });

  it('takes no files while disabled, and marks nothing', () => {
    const { dropzone, fixture, host, send } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    send('dragenter', dropzone, [png]);
    expect(dropzone.hasAttribute('data-dragging')).toBe(false);

    send('drop', dropzone, [png]);
    expect(host.files()).toEqual([]);
  });

  it('disables the control it labels, which is what stops the picker', () => {
    const { dropzone, fixture, host, input } = mount();
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(dropzone.getAttribute('data-disabled')).toBe('');
  });
});
