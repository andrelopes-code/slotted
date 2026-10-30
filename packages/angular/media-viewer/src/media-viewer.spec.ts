import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';

import { SlMediaViewer, SlMediaViewerAction } from './media-viewer';
import type { MediaViewerItem } from './media-viewer-defaults';

const ITEMS: MediaViewerItem[] = [
  { id: 'a', name: 'harbour.png', type: 'image/png', src: 'a.png', caption: 'The harbour.' },
  { id: 'b', name: 'contract.pdf', type: 'application/pdf', src: 'b.pdf', downloadHref: 'b.pdf' },
  {
    id: 'c',
    name: 'budget.xlsx',
    type: 'application/vnd.ms-excel',
    src: 'c.xlsx',
    downloadHref: 'c.xlsx',
  },
];

@Component({
  imports: [SlMediaViewer, SlMediaViewerAction],
  template: `
    <sl-media-viewer
      (valueChangeRequest)="valueRequests.push($event)"
      (zoomChangeRequest)="zoomRequests.push($event)"
      [(open)]="open"
      [(value)]="value"
      [items]="items()"
      [loop]="loop()"
      thumbnails
      thumbnailsLabel="Files"
    >
      <button slMediaViewerAction type="button">Share</button>
    </sl-media-viewer>
  `,
})
class Host {
  readonly open = signal(true);
  readonly value = signal<string | undefined>(undefined);
  readonly items = signal<readonly MediaViewerItem[]>(ITEMS);
  readonly loop = signal(false);
  readonly valueRequests: ChangeRequest<string>[] = [];
  readonly zoomRequests: ChangeRequest<number>[] = [];
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();

  return fixture;
}

const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-ui="media-viewer"] [data-part="${name}"]`);

function key(name: string, fixture: ReturnType<typeof setup>) {
  part('stage')!.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
  fixture.detectChanges();
}

describe('SlMediaViewer', () => {
  it('names the dialog by the file and describes it by its position', () => {
    setup();
    const dialog = document.querySelector('[role="dialog"]')!;
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;
    const position = document.getElementById(dialog.getAttribute('aria-describedby')!)!;

    expect(title.getAttribute('title')).toBe('harbour.png');
    expect(position.getAttribute('data-part')).toBe('position');
    expect(position.hasAttribute('data-part-description')).toBe(false);
    expect(position.textContent?.trim()).toBe('1 of 3');
    expect(
      document.querySelector('[data-ui="media-viewer"]')?.getAttribute('data-slotted-scheme'),
    ).toBe('dark');
  });

  it('steps with the buttons and the arrows, and stops at the ends without loop', () => {
    const fixture = setup();

    expect((part('previous') as HTMLButtonElement).disabled).toBe(true);
    part('next')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('b');
    expect(fixture.componentInstance.valueRequests.at(-1)?.reason).toBe('pointer');

    key('ArrowRight', fixture);
    expect(fixture.componentInstance.value()).toBe('c');
    expect(fixture.componentInstance.valueRequests.at(-1)?.reason).toBe('keyboard');
    expect((part('next') as HTMLButtonElement).disabled).toBe(true);
  });

  it('draws a PDF in a frame with no zoom, and offers a file it cannot draw for download', () => {
    const fixture = setup();
    fixture.componentInstance.value.set('b');
    fixture.detectChanges();

    expect(part('media')?.tagName).toBe('IFRAME');
    expect(part('media')?.hasAttribute('sandbox')).toBe(false);
    expect(part('zoom')).toBeNull();

    fixture.componentInstance.value.set('c');
    fixture.detectChanges();
    expect(part('unsupported')?.textContent).toContain('No preview for this file');
    expect(part('tile')?.textContent).toContain('XLSX');
  });

  it('zooms a loaded picture with the keys and puts the level back on a step', () => {
    const fixture = setup();
    part('media')!.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    key('+', fixture);
    expect(fixture.componentInstance.zoomRequests.at(-1)).toMatchObject({
      value: 1.25,
      reason: 'keyboard',
    });

    part('next')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.zoomRequests.at(-1)).toMatchObject({
      value: 1,
      reason: 'select',
    });
  });

  it('passes to the neighbour with the reason remove when the shown item leaves the set', () => {
    const fixture = setup();
    fixture.componentInstance.value.set('b');
    fixture.detectChanges();

    fixture.componentInstance.items.set(ITEMS.filter((item) => item.id !== 'b'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('c');
    expect(fixture.componentInstance.valueRequests.at(-1)?.reason).toBe('remove');
  });

  it('projects the consumer action into the bar and marks the current thumbnail', () => {
    setup();

    expect(part('actions')?.textContent).toContain('Share');
    const current = document.querySelector('[data-part="thumbnail"][aria-current="true"]');
    expect(current?.getAttribute('aria-label')).toBe('harbour.png');
  });

  it('shows the failure with retry and download, and loads again on retry', () => {
    const fixture = setup();
    part('media')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(part('status')?.textContent).toContain('This file didn’t load');
    expect(part('zoom')).toBeNull();
    part('retry')!.click();
    fixture.detectChanges();
    expect(part('media')?.tagName).toBe('IMG');
  });

  it('closes with the close button', () => {
    const fixture = setup();
    part('close')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('writes its words in the language in force', () => {
    setup([provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })]);

    // language: pt-BR
    expect(part('position')?.textContent?.trim()).toBe('1 de 3');
    expect(part('close')?.getAttribute('aria-label')).toBe('Fechar');
    // language: en-US
  });

  it('lets a consumer cancel a step', () => {
    @Component({
      imports: [SlMediaViewer],
      template: `<sl-media-viewer
        [items]="items"
        [open]="true"
        (valueChangeRequest)="$event.cancel()"
      />`,
    })
    class Refusing {
      readonly items = ITEMS;
    }
    const fixture = TestBed.createComponent(Refusing);
    fixture.detectChanges();
    const spy = vi.fn();
    part('next')!.addEventListener('click', spy);
    part('next')!.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
    expect(document.querySelector('[data-part="title"]')?.getAttribute('title')).toBe(
      'harbour.png',
    );
  });
});
