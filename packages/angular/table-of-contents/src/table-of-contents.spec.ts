import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import type { ChangeRequest } from '@slotted/core/state';
import contract from '../../../../specs/components/table-of-contents/contract.json';
import {
  SlTableOfContents,
  SlTableOfContentsLabel,
  SlTableOfContentsLink,
} from './table-of-contents';
import { provideTableOfContentsDefaults } from './table-of-contents-defaults';
import type {
  TableOfContentsHistory,
  TableOfContentsItemData,
  TableOfContentsLayout,
  TableOfContentsSize,
} from './table-of-contents-defaults';

/** The observer is a stub: the rule under test is the family's, not the layout engine's. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  fire() {
    this.callback([], this as never);
  }
}

class FakeResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const ITEMS: TableOfContentsItemData[] = [
  { id: 'dados', label: 'General details' },
  {
    id: 'addresses',
    label: 'Addresses',
    children: [
      { id: 'billing', label: 'Billing' },
      { id: 'delivery', label: 'Delivery' },
    ],
  },
  { id: 'contactos', label: 'Contactos' },
];

/** Targets in the document, at stated tops. */
function targets(tops: Record<string, number>) {
  for (const [id, top] of Object.entries(tops)) {
    const section = document.createElement('section');
    section.id = id;
    section.getBoundingClientRect = () =>
      ({ top, bottom: top + 200, height: 200, width: 600, left: 0, right: 600 }) as DOMRect;
    document.body.append(section);
  }
}

@Component({
  standalone: true,
  imports: [SlTableOfContents],
  template: `<nav
    slTableOfContents
    [items]="items()"
    [(value)]="value"
    [(open)]="open"
    [layout]="layout()"
    [size]="size()"
    [history]="history()"
    [label]="label()"
    [loading]="loading()"
    [landmark]="landmark()"
    (valueChangeRequest)="valueRequests.push($event)"
    (openChangeRequest)="openRequests.push($event)"
  ></nav>`,
})
class Host {
  readonly items = signal<TableOfContentsItemData[]>(ITEMS);
  readonly value = signal<string | null>(null);
  readonly open = signal(false);
  readonly layout = signal<TableOfContentsLayout | undefined>(undefined);
  readonly size = signal<TableOfContentsSize | undefined>(undefined);
  readonly history = signal<TableOfContentsHistory | undefined>(undefined);
  readonly label = signal<string | undefined>(undefined);
  readonly loading = signal(false);
  readonly landmark = signal<boolean | undefined>(undefined);
  readonly valueRequests: ChangeRequest<string | null>[] = [];
  readonly openRequests: ChangeRequest<boolean>[] = [];
}

@Component({
  standalone: true,
  imports: [SlTableOfContents, SlTableOfContentsLink, SlTableOfContentsLabel],
  template: `<div #region>
      <h1>Title</h1>
      <h2>General details</h2>
      <h3 id="kept">Billing</h3>
      <h4>Background</h4>
    </div>
    <nav slTableOfContents [source]="region" [(value)]="value">
      <ng-template slTableOfContentsLabel><em>Neste artigo</em></ng-template>
      <ng-template slTableOfContentsLink let-entry let-current="current">
        <strong>{{ entry.label }}{{ current ? ' ·' : '' }}</strong>
      </ng-template>
    </nav>`,
})
class FromSource {
  readonly value = signal<string | null>(null);
}

@Component({
  standalone: true,
  imports: [SlTableOfContents],
  providers: [
    provideTableOfContentsDefaults({
      layout: 'horizontal',
      numbered: true,
      size: 'sm',
      sticky: true,
    }),
  ],
  template: `<nav slTableOfContents [items]="items" [messages]="{ navigation: 'Sections' }"></nav>
    <nav slTableOfContents [items]="items" size="lg"></nav>`,
})
class WithDefaults {
  readonly items = ITEMS;
}

/** The language a `Spoken` list is in, changed by the test that reads it. */
const spokenLocale = signal('pt-BR');

@Component({
  standalone: true,
  imports: [SlTableOfContents],
  providers: [provideSlotted({ locale: spokenLocale, catalogs: { 'pt-BR': PT_BR } })],
  template: `<nav slTableOfContents [items]="items"></nav>`,
})
class Spoken {
  readonly items = ITEMS;
}

describe('SlTableOfContents', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const root = () =>
    fixture.nativeElement.querySelector('[data-ui="table-of-contents"]') as HTMLElement;
  const link = (value: string) =>
    fixture.nativeElement.querySelector(
      `[data-part="item"][data-value="${value}"] > [data-part="link"]`,
    ) as HTMLElement;
  const links = () =>
    [...fixture.nativeElement.querySelectorAll('[data-part="link"]')] as HTMLElement[];
  const trigger = () => fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLElement;
  const click = (element: HTMLElement, init: MouseEventInit = { detail: 1 }) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
    const accepted = element.dispatchEvent(event);
    fixture.detectChanges();
    return accepted;
  };
  const key = (element: HTMLElement, key: string) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    window.scrollTo = vi.fn();
    window.history.replaceState(null, '', '/');
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 4000,
    });
    /* And scrolled a little: at its start the first target is current before anything is measured. */
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 10 });
    await TestBed.configureTestingModule({
      imports: [Host, FromSource, WithDefaults, Spoken],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const section of document.querySelectorAll('body > section')) section.remove();
    document.documentElement.style.removeProperty('--slotted-page-sticky-top');
  });

  it('renders the parts the contract declares, named from the messages', () => {
    expect(root().tagName).toBe('NAV');
    expect(root().getAttribute('data-ui')).toBe(contract.ui);
    expect(root().getAttribute('aria-label')).toBe('On this page');
    expect(root().getAttribute('data-layout')).toBe('vertical');
    expect(root().getAttribute('data-size')).toBe('md');
    for (const part of ['panel', 'list', 'item', 'link', 'group', 'marker']) {
      expect(fixture.nativeElement.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(links()).toHaveLength(5);
    expect(link('billing').getAttribute('href')).toBe('#billing');
    expect(link('billing').closest('[data-part="item"]')?.getAttribute('data-depth')).toBe('2');
  });

  it('names the landmark by its label when it has one, and writes no name under landmark=false', () => {
    host.label.set('On this page');
    fixture.detectChanges();
    const labelNode = fixture.nativeElement.querySelector('[data-part="label"]') as HTMLElement;
    expect(root().getAttribute('aria-labelledby')).toBe(labelNode.id);
    expect(root().hasAttribute('aria-label')).toBe(false);

    host.landmark.set(false);
    fixture.detectChanges();
    expect(root().hasAttribute('aria-labelledby')).toBe(false);
    expect(root().hasAttribute('aria-label')).toBe(false);
  });

  it('marks the current link with aria-current=location and data-current on the link and its item', () => {
    host.value.set('delivery');
    fixture.detectChanges();
    expect(link('delivery').getAttribute('aria-current')).toBe('location');
    expect(link('delivery').hasAttribute('data-current')).toBe(true);
    expect(link('delivery').closest('[data-part="item"]')?.hasAttribute('data-current')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('draws skeleton rows while loading and hides itself while empty', () => {
    host.items.set([]);
    host.loading.set(true);
    fixture.detectChanges();
    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('[data-part="skeleton"]')).toHaveLength(4);
    host.loading.set(false);
    fixture.detectChanges();
    expect(root().hasAttribute('data-empty')).toBe(true);
  });

  describe('navigating', () => {
    it('asks value with pointer, scrolls the target under the chrome, pushes the URL and focuses the target', () => {
      targets({ dados: 100, addresses: 900 });
      document.documentElement.style.setProperty('--slotted-page-sticky-top', '56px');
      const push = vi.spyOn(window.history, 'pushState');
      expect(click(link('addresses'))).toBe(false);
      expect(host.valueRequests.at(-1)?.reason).toBe('pointer');
      expect(host.value()).toBe('addresses');
      expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 10 + 900 - 56, behavior: 'smooth' });
      expect(push).toHaveBeenCalledWith(null, '', '#addresses');
      const target = document.getElementById('addresses') as HTMLElement;
      expect(document.activeElement).toBe(target);
      expect(target.getAttribute('tabindex')).toBe('-1');
    });

    it('replaces or leaves the URL by history, and reports keyboard for a synthesised click', () => {
      targets({ dados: 100 });
      host.history.set('replace');
      fixture.detectChanges();
      const replace = vi.spyOn(window.history, 'replaceState');
      const push = vi.spyOn(window.history, 'pushState');
      click(link('dados'), { detail: 0 });
      expect(host.valueRequests.at(-1)?.reason).toBe('keyboard');
      expect(replace).toHaveBeenCalledWith(null, '', '#dados');

      host.history.set('none');
      fixture.detectChanges();
      replace.mockClear();
      push.mockClear();
      click(link('dados'));
      expect(replace).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it('leaves a modifier click to the platform', () => {
      targets({ dados: 100 });
      expect(click(link('dados'), { metaKey: true })).toBe(true);
      expect(host.valueRequests).toHaveLength(0);
      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('scrolls even when the request is refused', () => {
      targets({ dados: 100, addresses: 900 });
      host.value.set('dados');
      fixture.detectChanges();
      const sub = fixture.debugElement
        .query((node) => node.nativeElement === root())
        .componentInstance.valueChangeRequest.subscribe((request: ChangeRequest<string | null>) =>
          request.cancel(),
        );
      click(link('addresses'));
      expect(window.scrollTo).toHaveBeenCalled();
      expect(host.value()).toBe('dados');
      sub.unsubscribe();
    });

    it('exposes focus, refresh and scrollTo on the instance', () => {
      targets({ dados: 100, contactos: 1500 });
      const push = vi.spyOn(window.history, 'pushState');
      const instance = fixture.debugElement.query((node) => node.nativeElement === root())
        .componentInstance as SlTableOfContents;
      instance.scrollTo('contactos');
      fixture.detectChanges();
      expect(host.valueRequests.at(-1)?.reason).toBe('programmatic');
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 10 + 1500, behavior: 'smooth' });
      expect(push).not.toHaveBeenCalled();
      instance.focus();
      expect(document.activeElement).toBe(link('dados'));
      instance.refresh();
    });
  });

  describe('observing', () => {
    it('asks value to move with the reason scroll as targets pass the line', async () => {
      targets({ dados: 100, addresses: 900, contactos: 1700 });
      fixture = TestBed.createComponent(Host);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.valueRequests).toHaveLength(0);

      (document.getElementById('dados') as HTMLElement).getBoundingClientRect = () =>
        ({ top: -50, bottom: 150, height: 200, width: 600, left: 0, right: 600 }) as DOMRect;
      FakeIntersectionObserver.instances.at(-1)?.fire();
      fixture.detectChanges();
      expect(host.valueRequests.at(-1)?.reason).toBe('scroll');
      expect(host.value()).toBe('dados');
      expect(link('dados').getAttribute('aria-current')).toBe('location');
    });
  });

  describe('source', () => {
    it('reads the headings of a region, writes missing ids, and shapes links and label by template', () => {
      const from = TestBed.createComponent(FromSource);
      from.detectChanges();
      const hrefs = [...from.nativeElement.querySelectorAll('[data-part="link"]')].map((node) =>
        (node as HTMLElement).getAttribute('href'),
      );
      expect(hrefs).toEqual(['#general-details', '#kept']);
      expect(from.nativeElement.querySelector('h2')?.id).toBe('general-details');
      expect(from.nativeElement.querySelector('[data-part="link"] strong')?.textContent).toBe(
        'General details',
      );
      expect(from.nativeElement.querySelector('[data-part="label"] em')?.textContent).toBe(
        'Neste artigo',
      );
      const nav = from.nativeElement.querySelector('[data-ui="table-of-contents"]') as HTMLElement;
      expect(nav.getAttribute('aria-labelledby')).toBe(
        from.nativeElement.querySelector('[data-part="label"]')?.id,
      );
    });
  });

  describe('collapsed', () => {
    beforeEach(() => {
      host.layout.set('collapsed');
      host.label.set('On this page');
      host.value.set('addresses');
      fixture.detectChanges();
    });

    it('renders a trigger with the label and the current text that opens the list', () => {
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(
        trigger().querySelector(
          '[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph="chevron-down"]',
        ),
      ).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-part="current"]')?.textContent).toBe(
        'Addresses',
      );
      const panel = fixture.nativeElement.querySelector('[data-part="panel"]') as HTMLElement;
      expect(trigger().getAttribute('aria-controls')).toBe(panel.id);
      click(trigger());
      expect(host.openRequests.at(-1)?.reason).toBe('pointer');
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(root().hasAttribute('data-open')).toBe(true);
    });

    it('opens on ArrowDown onto the first link, and closes on Escape back onto the trigger', async () => {
      trigger().focus();
      key(trigger(), 'ArrowDown');
      await fixture.whenStable();
      expect(host.openRequests.at(-1)?.reason).toBe('keyboard');
      expect(host.open()).toBe(true);
      expect(document.activeElement).toBe(link('dados'));

      key(document.activeElement as HTMLElement, 'Escape');
      expect(host.openRequests.at(-1)?.reason).toBe('escape');
      expect(host.open()).toBe(false);
      expect(document.activeElement).toBe(trigger());
    });

    it('closes on a choice with the reason select, and on a press outside with outsidePress', async () => {
      targets({ contactos: 400 });
      host.open.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      click(link('contactos'));
      expect(host.openRequests.at(-1)?.reason).toBe('select');

      host.open.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.openRequests.at(-1)?.reason).toBe('outsidePress');
    });
  });

  describe('keyboard', () => {
    it('walks the links with the arrows, Home and End', () => {
      const all = links();
      all[0]?.focus();
      key(all[0] as HTMLElement, 'ArrowDown');
      expect(document.activeElement).toBe(all[1]);
      key(all[1] as HTMLElement, 'End');
      expect(document.activeElement).toBe(all[4]);
      key(all[4] as HTMLElement, 'ArrowUp');
      expect(document.activeElement).toBe(all[3]);
      key(all[3] as HTMLElement, 'Home');
      expect(document.activeElement).toBe(all[0]);
    });

    it('walks the bar with ArrowRight and ArrowLeft', () => {
      host.layout.set('horizontal');
      fixture.detectChanges();
      const all = links();
      all[0]?.focus();
      key(all[0] as HTMLElement, 'ArrowRight');
      expect(document.activeElement).toBe(all[1]);
      key(all[1] as HTMLElement, 'ArrowLeft');
      expect(document.activeElement).toBe(all[0]);
    });
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    spokenLocale.set('pt-BR');
    const spoken = TestBed.createComponent(Spoken);
    spoken.detectChanges();
    const list = spoken.nativeElement.querySelector('[data-ui="table-of-contents"]') as HTMLElement;
    // language: pt-BR
    expect(list.getAttribute('aria-label')).toBe('Nesta página');
    // language: en-US

    spokenLocale.set('en-US');
    spoken.detectChanges();
    expect(list.getAttribute('aria-label')).toBe('On this page');
  });

  it('reads the axes from the provider, and lets a list win', () => {
    const provided = TestBed.createComponent(WithDefaults);
    provided.detectChanges();
    const [first, second] = [
      ...provided.nativeElement.querySelectorAll('[data-ui="table-of-contents"]'),
    ] as HTMLElement[];
    expect(first?.getAttribute('aria-label')).toBe('Sections');
    expect(first?.getAttribute('data-layout')).toBe('horizontal');
    expect(first?.getAttribute('data-size')).toBe('sm');
    expect(first?.hasAttribute('data-numbered')).toBe(true);
    expect(first?.hasAttribute('data-sticky')).toBe(true);
    expect(second?.getAttribute('data-size')).toBe('lg');
  });
});
