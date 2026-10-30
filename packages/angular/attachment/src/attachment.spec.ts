import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/attachment/contract.json';

import { SlAttachment, SlAttachmentGroup } from './attachment';
import type { AttachmentFile, AttachmentRemoveRequest } from './attachment-defaults';
import { ATTACHMENT_KIND_GLYPH, provideAttachmentDefaults } from './attachment-defaults';
import {
  SlAttachmentAction,
  SlAttachmentActions,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentMessage,
  SlAttachmentPreview,
  SlAttachmentProgress,
  SlAttachmentRemove,
  SlAttachmentTrigger,
} from './attachment-parts';

const CLAIM: AttachmentFile = {
  name: 'claim-form-2026-0914.pdf',
  type: 'application/pdf',
  size: 248_000,
};

@Component({
  imports: [
    SlAttachment,
    SlAttachmentAction,
    SlAttachmentActions,
    SlAttachmentBody,
    SlAttachmentDetail,
    SlAttachmentGroup,
    SlAttachmentMessage,
    SlAttachmentPreview,
    SlAttachmentProgress,
    SlAttachmentRemove,
    SlAttachmentTrigger,
  ],
  template: `
    <ul slAttachmentGroup aria-label="Attachments" id="group">
      <li
        slAttachment
        id="root"
        [file]="file"
        [invalid]="invalid()"
        [loading]="loading()"
        [disabled]="disabled()"
        [removable]="removable()"
        (remove)="removed($event)"
      >
        <span slAttachmentPreview id="preview" [src]="src()"></span>
        <div slAttachmentBody>
          <a slAttachmentTrigger href="/claim.pdf" (click)="opened()"></a>
          <p slAttachmentDetail id="detail"></p>
        </div>
        <p slAttachmentMessage>Rejected by the virus scan.</p>
        <div slAttachmentProgress [value]="62"></div>
        <div slAttachmentActions>
          <button slAttachmentAction aria-label="Share claim-form-2026-0914.pdf">S</button>
          <button slAttachmentRemove></button>
        </div>
      </li>
    </ul>
  `,
})
class Full {
  readonly file = CLAIM;
  readonly invalid = signal(false);
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly removable = signal(false);
  readonly src = signal<string | undefined>(undefined);
  readonly removed = vi.fn<(request: AttachmentRemoveRequest) => void>();
  readonly opened = vi.fn();
}

function mount() {
  const fixture = TestBed.createComponent(Full);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const q = (selector: string) => element.querySelector(selector) as HTMLElement;
  return { fixture, element, q, host: fixture.componentInstance };
}

describe('SlAttachment', () => {
  it('is selected in public by the family identifier and every contract part', () => {
    const { q, host, fixture } = mount();
    host.removable.set(true);
    fixture.detectChanges();
    expect(q('#root').getAttribute('data-ui')).toBe(contract.ui);
    expect(q('#root').getAttribute('data-part')).toBe('root');
    for (const part of contract.members.attachment.parts) {
      if (part === 'root') continue;
      expect(q(`[data-part="${part}"]`), part).not.toBeNull();
    }
  });

  it('reads the kind, the split name and the size from the file', () => {
    const { q } = mount();
    expect(q('#root').getAttribute('data-kind')).toBe('pdf');
    expect(q('#preview').getAttribute('data-extension')).toBe('PDF');
    expect(q('#preview').getAttribute('aria-hidden')).toBe('true');
    expect(q('#preview svg').getAttribute('data-glyph')).toBe(ATTACHMENT_KIND_GLYPH.pdf);
    expect(q('[data-part="name"]').textContent).toBe('claim-form-2026-0914');
    expect(q('[data-part="extension"]').textContent).toBe('.pdf');
    expect(q('[data-part="filename"]').getAttribute('dir')).toBe('auto');
    expect(q('#detail').textContent?.trim()).toBe('248 kB');
  });

  it('draws each kind with the mark the contract names', () => {
    for (const [kind, entry] of Object.entries(contract.kinds)) {
      expect(ATTACHMENT_KIND_GLYPH[kind as keyof typeof ATTACHMENT_KIND_GLYPH]).toBe(entry.glyph);
    }
  });

  it('shows a thumbnail, and returns to the tile when it fails to load', () => {
    const { q, host, fixture } = mount();
    host.src.set('/claim.png');
    fixture.detectChanges();
    const image = q('#preview img');
    expect(image.getAttribute('alt')).toBe('');
    /* A list of a hundred receipts fetched every thumbnail at once. */
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('decoding')).toBe('async');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(q('#preview img')).toBeNull();
    expect(q('#preview svg')).not.toBeNull();
  });

  it('names the trigger by the file and describes it by the detail and the message', () => {
    const { q } = mount();
    const trigger = q('[data-part="trigger"]');
    expect(trigger.getAttribute('title')).toBe(CLAIM.name);
    const ids = (trigger.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    expect(q(`#${ids[0]}`).getAttribute('data-part')).toBe('detail');
    expect(q(`#${ids[1]}`).getAttribute('data-part')).toBe('message');
  });

  it('paints the three states from data and keeps aria-invalid off the list item', () => {
    const { q, host, fixture } = mount();
    host.invalid.set(true);
    host.loading.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    const root = q('#root');
    expect(root.hasAttribute('data-invalid')).toBe(true);
    expect(root.hasAttribute('data-loading')).toBe(true);
    expect(root.hasAttribute('data-disabled')).toBe(true);
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.hasAttribute('aria-invalid')).toBe(false);
    expect(root.hasAttribute('aria-disabled')).toBe(false);
  });

  it('refuses the link trigger while loading, before the page handler, and keeps its destination', () => {
    const { q, host, fixture } = mount();
    host.loading.set(true);
    fixture.detectChanges();
    const trigger = q('[data-part="trigger"]');
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('href')).toBe('/claim.pdf');
    trigger.click();
    expect(host.opened).not.toHaveBeenCalled();
    host.loading.set(false);
    fixture.detectChanges();
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(host.opened).toHaveBeenCalledOnce();
  });

  it('hides remove unless removable, and names it by the file', () => {
    const { q, host, fixture } = mount();
    expect(q('[data-part="remove"]').hasAttribute('hidden')).toBe(true);
    host.removable.set(true);
    fixture.detectChanges();
    const remove = q('[data-part="remove"]');
    expect(remove.hasAttribute('hidden')).toBe(false);
    expect(remove.getAttribute('aria-label')).toBe(`Remove ${CLAIM.name}`);
    expect(remove.getAttribute('type')).toBe('button');
  });

  it('asks to be removed with the reason the control or the key gives', () => {
    const { q, host, fixture } = mount();
    host.removable.set(true);
    fixture.detectChanges();
    q('[data-part="remove"]').click();
    expect(host.removed).toHaveBeenLastCalledWith(
      expect.objectContaining({ file: CLAIM, reason: 'remove' }),
    );
    const trigger = q('[data-part="trigger"]');
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }),
    );
    expect(host.removed).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'keyboard' }));
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Backspace',
        repeat: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(host.removed).toHaveBeenCalledTimes(2);
  });

  it('refuses removal and the family actions while disabled', () => {
    const { q, host, fixture } = mount();
    host.removable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(q('[data-part="remove"]').hasAttribute('disabled')).toBe(true);
    expect(q('[data-part="action"]').hasAttribute('disabled')).toBe(true);
    q('[data-part="trigger"]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }),
    );
    expect(host.removed).not.toHaveBeenCalled();
  });

  it('draws the transfer with the progress bar, named by the file', () => {
    const { q } = mount();
    const bar = q('[data-part="progress"] [role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('62');
    const labelledBy = bar.getAttribute('aria-labelledby');
    const name =
      labelledBy === null ? bar.getAttribute('aria-label') : q(`#${labelledBy}`).textContent;
    expect(name?.trim()).toBe(CLAIM.name);
  });

  it('takes focus by script only, and hands the group its size and orientation', () => {
    const { q } = mount();
    expect(q('#group').getAttribute('tabindex')).toBe('-1');
    expect(q('#group').getAttribute('data-layout')).toBe('list');
    expect(q('#root').getAttribute('data-size')).toBe('md');
  });
});

@Component({
  imports: [SlAttachment, SlAttachmentGroup, SlAttachmentRemove],
  template: `
    <ul slAttachmentGroup aria-label="Pièces jointes" id="group" orientation="vertical">
      <li slAttachment id="a" [file]="file" [messages]="{ remove: 'Retirer {name}' }" removable>
        <button slAttachmentRemove></button>
      </li>
      <li slAttachment id="b" [file]="file" size="sm" orientation="horizontal"></li>
    </ul>
  `,
})
class Inherited {
  readonly file = CLAIM;
}

describe('SlAttachment defaults', () => {
  it('inherits from the group and the provider, and its own input wins', () => {
    TestBed.configureTestingModule({
      providers: [provideAttachmentDefaults({ layout: 'strip', size: 'lg' })],
    });
    const fixture = TestBed.createComponent(Inherited);
    fixture.detectChanges();
    const q = (selector: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLElement;
    expect(q('#group').getAttribute('data-layout')).toBe('strip');
    expect(q('#a').getAttribute('data-size')).toBe('lg');
    expect(q('#a').getAttribute('data-orientation')).toBe('vertical');
    expect(q('#b').getAttribute('data-size')).toBe('sm');
    expect(q('#b').getAttribute('data-orientation')).toBe('horizontal');
    expect(q('[data-part="remove"]').getAttribute('aria-label')).toBe(`Retirer ${CLAIM.name}`);
  });
});

@Component({
  imports: [SlAttachment, SlAttachmentDetail, SlAttachmentPreview, SlAttachmentRemove],
  template: `
    <div slAttachment [file]="file" removable>
      <span slAttachmentPreview id="preview"></span>
      <p slAttachmentDetail id="detail"></p>
      <button slAttachmentRemove></button>
    </div>
  `,
})
class Spoken {
  readonly file: AttachmentFile = { name: 'README', size: 1_500_000 };
}

describe('SlAttachment language', () => {
  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(Spoken);
    fixture.detectChanges();
    const q = (selector: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLElement;
    expect(q('[data-part="remove"]').getAttribute('aria-label')).toBe('Remover README');
    expect(q('#preview').getAttribute('data-extension')).toBe('ARQUIVO');
    expect(q('#detail').textContent?.trim()).toBe('1,5 MB');

    locale.set('en-US');
    fixture.detectChanges();
    expect(q('[data-part="remove"]').getAttribute('aria-label')).toBe('Remove README');
    expect(q('#detail').textContent?.trim()).toBe('1.5 MB');
  });
});

@Component({
  imports: [SlAttachment, SlAttachmentActions, SlAttachmentGroup, SlAttachmentRemove],
  template: `
    <ul slAttachmentGroup aria-label="Tray">
      @for (file of files(); track file.name) {
        <li slAttachment [file]="file" removable (remove)="drop(file)">
          <div slAttachmentActions><button slAttachmentRemove></button></div>
        </li>
      }
    </ul>
  `,
})
class Tray {
  readonly files = signal<AttachmentFile[]>([
    { name: 'a.pdf' },
    { name: 'b.pdf' },
    { name: 'c.pdf' },
  ]);
  drop(file: AttachmentFile) {
    this.files.update((all) => all.filter((each) => each !== file));
  }
}

describe('SlAttachmentGroup removal', () => {
  it('moves focus to the attachment that took the removed one’s place', async () => {
    const fixture = TestBed.createComponent(Tray);
    fixture.detectChanges();
    document.body.append(fixture.nativeElement);
    const element = fixture.nativeElement as HTMLElement;
    const remove = element.querySelector('[aria-label="Remove b.pdf"]') as HTMLButtonElement;
    remove.focus();
    remove.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove c.pdf');
    fixture.nativeElement.remove();
  });
});
