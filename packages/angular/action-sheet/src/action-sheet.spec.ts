import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/action-sheet/contract.json';
import { SlActionSheet } from './action-sheet';
import type { ActionSheetChangeRequest, ActionSheetSelectEvent } from './action-sheet-defaults';
import { SL_ACTION_SHEET } from './action-sheet-parts';

@Component({
  standalone: true,
  imports: [...SL_ACTION_SHEET],
  template: `<button [slActionSheetTrigger]="s">Share</button>
    <sl-action-sheet
      #s="slActionSheet"
      [(open)]="open"
      [modal]="modal()"
      [escape]="escape()"
      (openChangeRequest)="onRequest($event)"
      (closed)="results.push($event)"
    >
      <header slActionSheetHeader>
        <h2 slActionSheetTitle>Share report</h2>
        <p slActionSheetMessage>Recipients see today's version.</p>
      </header>
      <div slActionSheetList>
        @if (danger()) {
          <button slActionSheetItem value="delete" tone="danger">Delete draft</button>
        }
        <button slActionSheetItem value="copy" (select)="selects.push($event)">
          <span slActionSheetItemIcon></span>
          Copy link
        </button>
        <div slActionSheetGroup>
          <div slActionSheetGroupLabel>Export</div>
          <button slActionSheetItem value="pdf" [loading]="loading()">
            Download PDF
            <span slActionSheetItemDescription>14 pages</span>
          </button>
          <button slActionSheetItem value="csv" disabled>Download CSV</button>
        </div>
        <hr slActionSheetSeparator />
        <button slActionSheetItem value="open" [closeOnSelect]="false">Open in browser</button>
      </div>
      @if (withCancel()) {
        <div slActionSheetFooter><button slActionSheetCancel></button></div>
      }
    </sl-action-sheet>`,
})
class Host {
  readonly open = signal(false);
  readonly modal = signal<boolean | undefined>(undefined);
  readonly escape = signal<'close' | 'none' | undefined>(undefined);
  readonly danger = signal(false);
  readonly loading = signal(false);
  readonly withCancel = signal(true);
  readonly refuse = signal(false);
  readonly requests: ActionSheetChangeRequest[] = [];
  readonly selects: ActionSheetSelectEvent[] = [];
  readonly results: (string | undefined)[] = [];

  onRequest(request: ActionSheetChangeRequest) {
    this.requests.push(request);
    if (this.refuse()) request.cancel();
  }
}

async function mount(configure?: (host: Host) => void, providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [Host], providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

async function settle(fixture: ComponentFixture<Host>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  fixture.detectChanges();
  await fixture.whenStable();
}

const q = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T & HTMLElement>(selector);
const items = () => [...document.querySelectorAll<HTMLElement>("[data-part='item']")];
const trigger = () => q("[data-part='trigger']")!;

async function openSheet(fixture: ComponentFixture<Host>) {
  trigger().click();
  await settle(fixture);
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.querySelectorAll("[data-ui='action-sheet']").forEach((node) => node.remove());
});

describe('SlActionSheet', () => {
  it('renders the anatomy the contract declares, under the family identifier', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    expect(q("[data-ui='action-sheet']")).not.toBeNull();
    const parts = new Set(
      [...document.querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    for (const part of contract.members['action-sheet'].parts) {
      expect(parts.has(part), part).toBe(true);
    }
  });

  it('is a modal dialog, named and described, holding a named menu', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    const panel = q("[data-part='panel']")!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-labelledby')).toBe(q("[data-part='title']")!.id);
    expect(panel.getAttribute('aria-describedby')).toBe(q("[data-part='message']")!.id);
    const list = q("[data-part='list']")!;
    expect(list.getAttribute('role')).toBe('menu');
    expect(list.getAttribute('aria-labelledby')).toBe(q("[data-part='title']")!.id);
    const group = q("[data-part='group']")!;
    expect(group.getAttribute('aria-labelledby')).toBe(q("[data-part='group-label']")!.id);
  });

  it('wires the trigger to the panel it opens', async () => {
    const fixture = await mount();
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    await openSheet(fixture);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(q("[data-part='panel']")!.id);
  });

  it('enters on the first action that can run, and on the cancel when it is destructive', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    expect(document.activeElement).toBe(items()[0]);
    expect(items()[0]!.getAttribute('tabindex')).toBe('0');
    TestBed.resetTestingModule();
    document.querySelectorAll("[data-ui='action-sheet']").forEach((node) => node.remove());

    const destructive = await mount((host) => host.danger.set(true));
    await openSheet(destructive);
    expect(document.activeElement).toBe(q("[data-part='cancel']"));
  });

  it('closes with select, carrying the chosen value, after (select) runs', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    items()[0]!.click();
    await settle(fixture);
    const host = fixture.componentInstance;
    expect(host.selects[0]?.value).toBe('copy');
    const request = host.requests.at(-1)!;
    expect(request.value).toBe(false);
    expect(request.reason).toBe('select');
    expect(request.result).toBe('copy');
    expect(host.open()).toBe(false);
    expect(host.results).toEqual(['copy']);
  });

  it('keeps the sheet open when closeOnSelect is false', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    items().at(-1)!.click();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('refuses a disabled or loading item, which stays focusable', async () => {
    const fixture = await mount((host) => host.loading.set(true));
    await openSheet(fixture);
    const [, loading, disabled] = items();
    loading!.click();
    disabled!.click();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(disabled!.getAttribute('aria-disabled')).toBe('true');
    expect(disabled!.hasAttribute('disabled')).toBe(false);
    expect(loading!.getAttribute('aria-busy')).toBe('true');
    expect(loading!.querySelector("[data-part='icon'] [data-ui='spinner']")).not.toBeNull();
  });

  it('closes with dismiss from the cancel, speaks the language in force, and returns focus', async () => {
    const locale = signal('pt-BR');
    const fixture = await mount(undefined, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    await openSheet(fixture);
    const cancel = q("[data-part='cancel']")!;
    expect(cancel.textContent?.trim()).toBe('Cancelar');
    locale.set('en-US');
    await settle(fixture);
    expect(cancel.textContent?.trim()).toBe('Cancel');
    cancel.click();
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('dismiss');
    expect(document.activeElement).toBe(trigger());
  });

  it('closes with escape, and refuses it under escape="none"', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('escape');

    fixture.componentInstance.escape.set('none');
    await openSheet(fixture);
    const before = fixture.componentInstance.requests.length;
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(fixture);
    expect(fixture.componentInstance.requests.length).toBe(before);
  });

  it('moves with the arrows, Home and End, disabled items included, and by typeahead', async () => {
    const fixture = await mount();
    await openSheet(fixture);
    const list = items();
    const key = (target: HTMLElement, name: string) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    key(list[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(list[1]);
    key(list[1]!, 'ArrowDown');
    expect(document.activeElement).toBe(list[2]);
    key(list[2]!, 'End');
    expect(document.activeElement).toBe(list[3]);
    key(list[3]!, 'ArrowDown');
    expect(document.activeElement).toBe(list[0]);
    key(list[0]!, 'o');
    expect(document.activeElement).toBe(list[3]);
  });

  it('asks before it opens, and a cancelled request leaves it closed', async () => {
    const fixture = await mount((host) => host.refuse.set(true));
    trigger().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    expect(fixture.componentInstance.requests[0]?.reason).toBe('pointer');
    expect(fixture.componentInstance.open()).toBe(false);
    expect(q("[data-part='panel']")).toBeNull();
  });

  it('paints no scrim and keeps the page live while not modal', async () => {
    const fixture = await mount((host) => host.modal.set(false));
    await openSheet(fixture);
    expect(q("[data-ui='action-sheet']")!.hasAttribute('data-modal')).toBe(false);
    expect(q("[data-part='panel']")!.hasAttribute('aria-modal')).toBe(false);
    expect(trigger().closest('[inert]')).toBeNull();
  });

  it('opens and closes through the instance, with the reason programmatic', async () => {
    const fixture = await mount();
    const sheet = fixture.debugElement.children
      .map((child) => child.injector.get(SlActionSheet, null))
      .find((found) => found !== null)!;
    sheet.show();
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('programmatic');
    sheet.close();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
