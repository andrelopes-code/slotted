import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlListboxLabel, SlListboxMeta } from '@slotted/angular/listbox';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import { SlTransfer, SlTransferFooter, SlTransferItem } from './transfer';
import {
  provideTransferDefaults,
  type TransferItem,
  type TransferLayout,
  type TransferMoveRequest,
  type TransferSelectionRequest,
} from './transfer-defaults';

const ITEMS: TransferItem[] = [
  { key: 'ana', label: 'Ana Souza', description: 'Design' },
  { key: 'bruno', label: 'Bruno Lima' },
  { key: 'carla', label: 'Carol Day' },
  { key: 'elisa', label: 'Ellis Price', disabled: true },
  // language: pt-BR
  { key: 'fabio', label: 'Fábio Nunes' },
  // language: en-US
];

@Component({
  standalone: true,
  imports: [SlTransfer, SlTransferItem, SlTransferFooter, SlListboxLabel, SlListboxMeta],
  template: `
    <div
      slTransfer
      #transfer="slTransfer"
      aria-label="Members"
      [items]="items()"
      [defaultTargetKeys]="defaultTarget()"
      [defaultSelectedKeys]="defaultSelected()"
      [reorderable]="reorderable()"
      [readOnly]="readOnly()"
      [layout]="layout()"
      [name]="name()"
      (targetKeysChangeRequest)="onMove($event)"
      (selectedKeysChangeRequest)="onSelect($event)"
    >
      @if (custom()) {
        <ng-template slTransferItem let-item>
          <span slListboxLabel>{{ item.label }}!</span>
          <span slListboxMeta>{{ item.key }}</span>
        </ng-template>
        <ng-template slTransferFooter let-side>footer {{ side }}</ng-template>
      }
    </div>
  `,
})
class Host {
  readonly items = signal<TransferItem[]>(ITEMS);
  readonly defaultTarget = signal<readonly string[] | undefined>(undefined);
  readonly defaultSelected = signal<readonly string[] | undefined>(undefined);
  readonly reorderable = signal(false);
  readonly readOnly = signal(false);
  readonly layout = signal<TransferLayout | undefined>(undefined);
  readonly name = signal<string | undefined>(undefined);
  readonly custom = signal(false);
  readonly cancelNext = signal(false);
  readonly moves: TransferMoveRequest[] = [];
  readonly selections: TransferSelectionRequest[] = [];
  readonly transfer = viewChild.required<SlTransfer>('transfer');

  onMove(request: TransferMoveRequest) {
    this.moves.push(request);
    if (this.cancelNext()) request.cancel();
  }

  onSelect(request: TransferSelectionRequest) {
    this.selections.push(request);
  }
}

async function settle<T>(fixture: ComponentFixture<T>) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

async function setup(configure?: (host: Host) => void): Promise<ComponentFixture<Host>> {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  await settle(fixture);
  return fixture;
}

const pane = (side: 'source' | 'target') =>
  document.querySelector<HTMLElement>(`[data-part="pane"][data-side="${side}"]`)!;
const list = (side: 'source' | 'target') =>
  pane(side).querySelector<HTMLElement>('[data-ui="listbox"]')!;
const keysIn = (side: 'source' | 'target') =>
  [...list(side).querySelectorAll<HTMLElement>('[data-part="option"]')].map(
    (node) => node.dataset['key'],
  );
const option = (key: string) =>
  document.querySelector<HTMLElement>(`[data-part="option"][data-key="${key}"]`)!;
const button = (part: string) =>
  document.querySelector<HTMLButtonElement>(`[data-part="${part}"]`)!;
const key = (target: HTMLElement, init: KeyboardEventInit) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

describe('SlTransfer', () => {
  it('draws the two panes from one collection and the target keys', async () => {
    await setup((host) => host.defaultTarget.set(['carla']));
    expect(keysIn('source')).toEqual(['ana', 'bruno', 'elisa', 'fabio']);
    expect(keysIn('target')).toEqual(['carla']);
    const root = document.querySelector('[data-ui="transfer"]')!;
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(list('source').getAttribute('aria-labelledby')).toBe(
      pane('source').getAttribute('aria-labelledby'),
    );
    expect(list('source').getAttribute('aria-multiselectable')).toBe('true');
    expect(
      pane('target').querySelector('[data-part="select-all"] input')!.getAttribute('aria-label'),
    ).toBe('Select all in Chosen');
  });

  it('writes its part on each move button, over the button family’s own', async () => {
    await setup();
    for (const part of [
      'move-to-target',
      'move-all-to-target',
      'move-to-source',
      'move-all-to-source',
    ]) {
      expect(button(part)?.getAttribute('data-ui')).toBe('button');
    }
    expect(button('move-to-target').getAttribute('aria-keyshortcuts')).toBe('Enter');
    expect(button('move-to-target').getAttribute('aria-disabled')).toBe('true');
    expect(button('move-to-target').hasAttribute('disabled')).toBe(false);
    expect(button('move-to-target').querySelector('[data-part="end"] > span')).not.toBeNull();
  });

  /** Every mark the family owns is the Glyph element, in the slot it points from. */
  it('draws the chevrons, the search glyph and the empty mark with the Glyph element', async () => {
    const fixture = await setup((host) => host.reorderable.set(true));
    const glyph = (scope: Element | null, slot: string) =>
      scope
        ?.querySelector(`${slot} > [data-ui="icon"] > svg[data-glyph]`)
        ?.getAttribute('data-glyph');
    expect(glyph(button('move-to-target'), '[data-part="end"]')).toBe('chevron-right');
    expect(glyph(button('move-all-to-target'), '[data-part="end"]')).toBe('chevrons-right');
    expect(glyph(button('move-to-source'), '[data-part="start"]')).toBe('chevron-right');
    expect(glyph(button('move-all-to-source'), '[data-part="start"]')).toBe('chevrons-right');
    expect(glyph(button('move-up'), '[data-part="start"]')).toBe('chevron-down');
    expect(glyph(button('move-down'), '[data-part="start"]')).toBe('chevron-down');
    expect(glyph(pane('source'), '[data-part="search-icon"]')).toBe('search');
    expect(glyph(pane('target'), '[data-part="empty"]')).toBe('inbox');

    const search = pane('target').querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'zzz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);
    expect(glyph(pane('target'), '[data-part="empty"][data-query]')).toBe('search-x');
  });

  it('asks to move the selection with the direction, the keys and the reason of the press', async () => {
    const fixture = await setup((host) => host.defaultSelected.set(['fabio', 'ana']));
    button('move-to-target').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    const request = fixture.componentInstance.moves[0]!;
    expect(request.value).toEqual(['ana', 'fabio']);
    expect(request.direction).toBe('target');
    expect(request.keys).toEqual(['ana', 'fabio']);
    expect(request.reason).toBe('pointer');
    expect(keysIn('target')).toEqual(['ana', 'fabio']);
    expect(fixture.componentInstance.selections.at(-1)!.value).toEqual([]);
  });

  it('keeps the value when the consumer cancels the move', async () => {
    const fixture = await setup((host) => {
      host.defaultSelected.set(['ana']);
      host.cancelNext.set(true);
    });
    button('move-to-target').click();
    await settle(fixture);
    expect(fixture.componentInstance.moves).toHaveLength(1);
    expect(keysIn('target')).toEqual([]);
    expect(fixture.componentInstance.selections).toHaveLength(0);
  });

  it('moves every visible enabled item and leaves a disabled one where it is', async () => {
    const fixture = await setup();
    button('move-all-to-target').click();
    await settle(fixture);
    expect(keysIn('source')).toEqual(['elisa']);
    expect(keysIn('target')).toEqual(['ana', 'bruno', 'carla', 'fabio']);
  });

  it('moves with Enter, back with Delete, and toward the inline end with Control+ArrowRight', async () => {
    const fixture = await setup((host) => host.defaultSelected.set(['bruno']));
    key(option('bruno'), { key: 'Enter' });
    await settle(fixture);
    expect(keysIn('target')).toEqual(['bruno']);
    expect(fixture.componentInstance.moves[0]!.reason).toBe('keyboard');

    option('bruno').focus();
    key(option('bruno'), { key: 'Delete' });
    await settle(fixture);
    expect(keysIn('target')).toEqual([]);

    option('carla').focus();
    key(option('carla'), { key: 'ArrowRight', ctrlKey: true });
    await settle(fixture);
    expect(keysIn('target')).toEqual(['carla']);
  });

  it('selects the visible enabled items of one pane from its select-all box', async () => {
    const fixture = await setup();
    const box = pane('source').querySelector<HTMLInputElement>('[data-part="select-all"] input')!;
    box.click();
    await settle(fixture);
    const request = fixture.componentInstance.selections[0]!;
    expect(request.value).toEqual(['ana', 'bruno', 'carla', 'fabio']);
    expect(request.reason).toBe('select');
    expect(pane('source').querySelector('[data-part="count"]')!.textContent).toContain(
      '4 of 5 selected',
    );
  });

  it('filters a pane by label and description, without accents', async () => {
    const fixture = await setup();
    const search = pane('source').querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'fabio';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);
    expect(keysIn('source')).toEqual(['fabio']);
    search.value = 'zzz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);
    expect(pane('source').querySelector('[data-part="empty"][data-query]')?.textContent).toContain(
      'No matches',
    );
  });

  it('reorders the target selection with the buttons and with Alt+ArrowUp', async () => {
    const fixture = await setup((host) => {
      host.reorderable.set(true);
      host.defaultTarget.set(['ana', 'bruno', 'carla']);
      host.defaultSelected.set(['carla']);
    });
    button('move-up').click();
    await settle(fixture);
    expect(keysIn('target')).toEqual(['ana', 'carla', 'bruno']);
    expect(fixture.componentInstance.moves[0]!.direction).toBe('reorder');
    key(option('carla'), { key: 'ArrowUp', altKey: true });
    await settle(fixture);
    expect(keysIn('target')).toEqual(['carla', 'ana', 'bruno']);
  });

  it('refuses every move while read-only', async () => {
    const fixture = await setup((host) => {
      host.readOnly.set(true);
      host.defaultSelected.set(['ana']);
    });
    button('move-to-target').click();
    key(option('ana'), { key: 'Enter' });
    await settle(fixture);
    expect(fixture.componentInstance.moves).toHaveLength(0);
  });

  it('keeps a target key the collection does not hold, and marks it', async () => {
    await setup((host) => host.defaultTarget.set(['ghost']));
    expect(keysIn('target')).toEqual(['ghost']);
    expect(
      option('ghost').querySelector('[data-part="indicator"][data-unresolved]'),
    ).not.toBeNull();
  });

  it('renders the consumer’s item and footer templates', async () => {
    await setup((host) => host.custom.set(true));
    expect(option('ana').querySelector('[data-part="label"]')!.textContent).toBe('Ana Souza!');
    expect(option('ana').querySelector('[data-part="meta"]')!.textContent).toBe('ana');
    expect(pane('target').querySelector('[data-part="pane-footer"]')!.textContent).toContain(
      'footer target',
    );
  });

  it('submits one hidden input per target key under the name', async () => {
    await setup((host) => {
      host.name.set('members');
      host.defaultTarget.set(['bruno', 'ana']);
    });
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input[name="members"]')];
    expect(inputs.map((input) => input.value)).toEqual(['ana', 'bruno']);
  });

  it('hands focus to the other list when its own list empties', async () => {
    const fixture = await setup((host) => {
      host.items.set(ITEMS.slice(0, 2));
      host.defaultTarget.set(['bruno']);
    });
    option('ana').focus();
    key(option('ana'), { key: 'Enter' });
    await settle(fixture);
    expect(keysIn('source')).toEqual([]);
    expect(list('target').contains(document.activeElement)).toBe(true);
  });
});

@Component({
  standalone: true,
  imports: [SlTransfer, ReactiveFormsModule],
  template: `<div slTransfer required [items]="items" [formControl]="control"></div>`,
})
class FormHost {
  readonly items = ITEMS;
  readonly control = new FormControl<readonly string[]>([], { nonNullable: true });
}

describe('SlTransfer in a form', () => {
  it('reads and writes the target keys, and reports required while empty', async () => {
    const fixture = TestBed.createComponent(FormHost);
    await settle(fixture);
    const control = fixture.componentInstance.control;
    expect(control.errors).toEqual({ required: true });
    control.setValue(['carla']);
    await settle(fixture);
    expect(keysIn('target')).toEqual(['carla']);
    expect(control.valid).toBe(true);
    button('move-all-to-target').click();
    await settle(fixture);
    expect(control.value).toEqual(['ana', 'bruno', 'carla', 'fabio']);
    control.disable();
    await settle(fixture);
    expect(document.querySelector('[data-ui="transfer"]')!.hasAttribute('data-disabled')).toBe(
      true,
    );
  });
});

@Component({
  standalone: true,
  imports: [SlTransfer],
  providers: [provideTransferDefaults({ size: 'sm' })],
  template: `<div slTransfer [items]="items" [messages]="{ target: 'Granted' }"></div>`,
})
class DefaultsHost {
  readonly items = ITEMS;
}

@Component({
  standalone: true,
  imports: [SlTransfer],
  template: `<div slTransfer [items]="items"></div>`,
})
class LanguageHost {
  readonly items = ITEMS;
}

describe('SlTransfer defaults', () => {
  it('takes its look from the provider, and its own messages over the language', async () => {
    const fixture = TestBed.createComponent(DefaultsHost);
    await settle(fixture);
    const root = document.querySelector('[data-ui="transfer"]')!;
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(pane('source').querySelector('[data-part="title"]')!.textContent).toBe('Available');
    expect(pane('target').querySelector('[data-part="title"]')!.textContent).toBe('Granted');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(LanguageHost);
    await settle(fixture);
    const title = () => pane('source').querySelector('[data-part="title"]')!.textContent;
    // language: pt-BR
    expect(title()).toBe('Disponíveis');
    // language: en-US

    locale.set('en-US');
    await settle(fixture);
    expect(title()).toBe('Available');
  });
});
