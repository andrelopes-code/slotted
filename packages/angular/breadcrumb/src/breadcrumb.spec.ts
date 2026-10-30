import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/breadcrumb/contract.json';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
  SlBreadcrumbTrigger,
} from './breadcrumb';
import { collapsedRange, provideBreadcrumbDefaults } from './breadcrumb.constants';

@Component({
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlBreadcrumbPage],
  template: `<nav
    slBreadcrumb
    [messages]="messages()"
    [maxItems]="maxItems()"
    [expanded]="expanded()"
    (expandedChange)="onExpandedChange($event)"
  >
    <ol slBreadcrumbList>
      @for (level of levels(); track level) {
        <li slBreadcrumbItem>
          <a slBreadcrumbLink [href]="'#' + level">{{ level }}</a>
        </li>
      }
      <li slBreadcrumbItem><span slBreadcrumbPage>INV-0041</span></li>
    </ol>
  </nav>`,
})
class TestHost {
  readonly levels = signal(['Workspace', 'Northwind', 'Accounts', 'Billing', 'Invoices']);
  readonly messages = signal<{ label?: string } | undefined>(undefined);
  readonly maxItems = signal<number | undefined>(0);
  readonly expanded = signal<boolean | undefined>(undefined);
  readonly onExpandedChange = vi.fn();
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="breadcrumb"]') as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    ellipsis: () => root.querySelector('[data-part="ellipsis"]') as HTMLButtonElement | null,
    items: () => [...root.querySelectorAll('[data-part="item"]')] as HTMLElement[],
    settle: () => fixture.detectChanges(),
  };
}

describe('SlBreadcrumb', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { root } = setup();

    expect(root.tagName).toBe('NAV');
    expect(root?.getAttribute('data-part')).toBe('root');
    expect(root.querySelector('[data-part="list"]')?.tagName).toBe('OL');
    expect(root.querySelector('[data-part="link"]')?.tagName).toBe('A');
    expect(root.querySelector('[data-part="page"]')?.tagName).toBe('SPAN');
  });

  it('names the landmark, and takes the consumer name over its own', () => {
    const { root, host, settle } = setup();
    expect(root?.getAttribute('aria-label')).toBe('Breadcrumb');

    host.messages.set({ label: 'Invoice' });
    settle();
    expect(root?.getAttribute('aria-label')).toBe('Invoice');
  });

  it('marks the current page as text rather than as a link', () => {
    const { root } = setup();

    const page = root.querySelector('[data-part="page"]') as HTMLElement;
    expect(page?.getAttribute('aria-current')).toBe('page');
    expect(contract.currentSource).toBe('aria-current');
  });

  it('draws a separator after every crumb but the last', () => {
    const { root, items } = setup();

    expect(root.querySelectorAll('[data-part="separator"]')).toHaveLength(items().length - 1);
    expect(items().at(-1)?.querySelector('[data-part="separator"]')).toBeNull();
  });

  describe('collapse', () => {
    it('keeps the same number of crumbs whatever it folds', () => {
      expect(collapsedRange(3, 1, 2)).toBeUndefined();
      expect(collapsedRange(4, 1, 2)).toEqual({ start: 1, end: 2 });
      expect(collapsedRange(9, 2, 3)).toEqual({ start: 2, end: 6 });
    });

    it('hides the middle and says how many it hides', () => {
      const { host, ellipsis, items, settle } = setup();
      host.maxItems.set(4);
      settle();

      expect(ellipsis()?.getAttribute('aria-label')).toBe('Show 3 hidden levels');
      expect(ellipsis()?.getAttribute('aria-expanded')).toBe('false');
      expect(
        ellipsis()?.querySelector('[data-ui="icon"] > svg[data-glyph="ellipsis"]'),
      ).not.toBeNull();
      expect(items().filter((item) => item.hasAttribute('hidden'))).toHaveLength(3);
    });

    it('reveals the trail and moves focus to the first crumb it revealed', async () => {
      const { fixture, host, ellipsis, items, root, settle } = setup();
      host.maxItems.set(4);
      settle();

      ellipsis()?.click();
      settle();
      await fixture.whenStable();

      expect(ellipsis()).toBeNull();
      expect(items().some((item) => item.hasAttribute('hidden'))).toBe(false);
      expect(document.activeElement).toBe(root.querySelectorAll('[data-part="link"]')[1]);
    });

    it('carries the reason a press and a key differ by', () => {
      const { host, ellipsis, settle } = setup();
      host.maxItems.set(4);
      settle();

      ellipsis()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      settle();

      expect(host.onExpandedChange).toHaveBeenCalledWith(
        expect.objectContaining({ previous: false, reason: 'keyboard', value: true }),
      );
    });

    it('never moves state the consumer owns', () => {
      const { host, ellipsis, settle } = setup();
      host.maxItems.set(4);
      host.expanded.set(false);
      settle();

      ellipsis()?.click();
      settle();

      expect(host.onExpandedChange).toHaveBeenCalledOnce();
      expect(ellipsis()).not.toBeNull();
    });

    it('writes the state a consumer may style', () => {
      const { host, root, settle } = setup();
      host.expanded.set(true);
      settle();

      expect(root?.getAttribute('data-expanded')).toBe('');
    });
  });

  it('takes the application defaults, and yields to an explicit input', () => {
    const { host, items, settle } = setup([provideBreadcrumbDefaults({ maxItems: 4 })]);
    /* The ellipsis is an item too, hidden while it has nothing to reveal. */
    const folded = () =>
      items().filter(
        (item) => item.hasAttribute('hidden') && !item.querySelector('[data-part="ellipsis"]'),
      );
    expect(folded()).toHaveLength(0);

    host.maxItems.set(undefined);
    settle();
    expect(folded()).toHaveLength(3);
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { host, root, ellipsis, settle } = setup([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    host.maxItems.set(4);
    settle();

    // language: pt-BR
    expect(root.getAttribute('aria-label')).toBe('Trilha de navegação');
    expect(ellipsis()?.getAttribute('aria-label')).toBe('Mostrar 3 níveis ocultos');
    // language: en-US

    locale.set('en-US');
    settle();
    expect(root.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(ellipsis()?.getAttribute('aria-label')).toBe('Show 3 hidden levels');
  });

  /** A static attribute the consumer wrote survives the host binding. */
  it('keeps an aria-label written straight onto the element', () => {
    @Component({
      imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbList],
      template: `<nav slBreadcrumb aria-label="Caminho">
        <ol slBreadcrumbList>
          <li slBreadcrumbItem>Home</li>
        </ol>
      </nav>`,
    })
    class Static {}

    TestBed.configureTestingModule({ imports: [Static] });
    const fixture = TestBed.createComponent(Static);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-ui="breadcrumb"]')?.getAttribute('aria-label'),
    ).toBe('Caminho');
  });
});

/**
 * jsdom lays nothing out, so a width is given to each crumb and to the list,
 * and `createCollapse` does the arithmetic a browser runs.
 */
function withLayout() {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return Number(this.dataset['testWidth'] ?? 0);
    },
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const width = Number(this.dataset['testWidth'] ?? 0);
    return { bottom: 0, height: 0, left: 0, right: width, top: 0, width, x: 0, y: 0 } as DOMRect;
  });
}

@Component({
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlBreadcrumbPage],
  template: `<nav slBreadcrumb [overflow]="overflow()" [maxItems]="maxItems()">
    <ol slBreadcrumbList [attr.data-test-width]="room()">
      @for (level of levels; track level) {
        <li slBreadcrumbItem data-test-width="100">
          <a slBreadcrumbLink [href]="'#' + level">{{ level }}</a>
        </li>
      }
      <li slBreadcrumbItem data-test-width="100"><span slBreadcrumbPage>INV-0041</span></li>
    </ol>
  </nav>`,
})
class Narrow {
  readonly levels = ['Workspace', 'Northwind', 'Accounts', 'Billing', 'Invoices'];
  readonly room = signal(350);
  readonly overflow = signal<'collapse' | 'wrap' | undefined>(undefined);
  readonly maxItems = signal<number | undefined>(undefined);
}

function narrow(configure: (host: Narrow) => void = () => undefined, providers: unknown[] = []) {
  withLayout();
  TestBed.configureTestingModule({ imports: [Narrow], providers: providers as never[] });
  const fixture = TestBed.createComponent(Narrow);
  configure(fixture.componentInstance);
  fixture.detectChanges();
  TestBed.tick();
  const root = fixture.nativeElement.querySelector('[data-ui="breadcrumb"]') as HTMLElement;
  const shown = () =>
    [...root.querySelectorAll<HTMLElement>('[data-part="item"]')].filter(
      (item) => !item.hasAttribute('hidden'),
    );
  return {
    fixture,
    root,
    ellipsis: () => root.querySelector('[data-part="ellipsis"]') as HTMLButtonElement | null,
    shown,
    settle: () => {
      fixture.detectChanges();
      TestBed.tick();
    },
  };
}

describe('SlBreadcrumb overflow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  });

  it('folds the middle crumbs nearest the root into the ellipsis', () => {
    const { ellipsis, root, shown } = narrow();

    expect(ellipsis()?.getAttribute('aria-label')).toBe('Show 3 hidden levels');
    expect(shown().map((item) => item.textContent?.trim())).toEqual([
      'Workspace',
      '',
      'Invoices',
      'INV-0041',
    ]);
    expect(root.getAttribute('data-collapsed')).toBe('3');
  });

  /**
   * The ellipsis is an item of its own, in front of the first crumb that can
   * fold. It used to be drawn inside that crumb, which the collapse hides — so
   * the control that reveals the trail was hidden with what it revealed.
   */
  it('keeps the ellipsis out of the crumbs it hides', () => {
    const { ellipsis } = narrow((host) => host.maxItems.set(4));
    const item = ellipsis()?.closest('[data-part="item"]') as HTMLElement;

    expect(item.hasAttribute('hidden')).toBe(false);
    expect(item.querySelector('[data-part="link"]')).toBeNull();
    expect(item.nextElementSibling?.hasAttribute('hidden')).toBe(true);
  });

  it('draws no ellipsis while the trail fits', () => {
    const { ellipsis, root } = narrow((host) => host.room.set(600));

    expect(ellipsis()?.closest('[data-part="item"]')?.hasAttribute('hidden')).toBe(true);
    expect(root.hasAttribute('data-collapsed')).toBe(false);
  });

  it('wraps instead when asked to, per instance or once for the application', () => {
    expect(narrow((host) => host.overflow.set('wrap')).ellipsis()).toBeNull();
    TestBed.resetTestingModule();
    expect(
      narrow(undefined, [provideBreadcrumbDefaults({ overflow: 'wrap' })]).ellipsis(),
    ).toBeNull();
  });

  it('expands what the width folded and gives focus to the first crumb it revealed', () => {
    const { ellipsis, fixture, root, settle, shown } = narrow();

    ellipsis()?.click();
    settle();

    expect(ellipsis()).toBeNull();
    expect(shown()).toHaveLength(6);
    expect(root.hasAttribute('data-expanded')).toBe(true);
    expect(fixture.nativeElement.ownerDocument.activeElement?.textContent).toBe('Northwind');
  });
});

describe('SlBreadcrumbTrigger', () => {
  @Component({
    imports: [
      SlBreadcrumb,
      SlBreadcrumbItem,
      SlBreadcrumbList,
      SlBreadcrumbTrigger,
      SlMenu,
      SlMenuItem,
      SlMenuTrigger,
    ],
    template: `<nav slBreadcrumb>
      <ol slBreadcrumbList>
        <li slBreadcrumbItem><button slBreadcrumbTrigger>web-app</button></li>
        <li slBreadcrumbItem>
          <button slBreadcrumbTrigger current [slMenuTriggerFor]="environments">Production</button>
          <sl-menu #environments><button slMenuItem>Preview</button></sl-menu>
        </li>
      </ol>
    </nav>`,
  })
  class Switchers {}

  function switchers() {
    TestBed.configureTestingModule({ imports: [Switchers] });
    const fixture = TestBed.createComponent(Switchers);
    fixture.detectChanges();
    TestBed.tick();
    const [plain, current] = [
      ...fixture.nativeElement.querySelectorAll('button[slBreadcrumbTrigger]'),
    ] as HTMLButtonElement[];
    return { fixture, plain: plain!, current: current! };
  }

  it('is a button dressed as a crumb, with a chevron after its label', () => {
    const { plain } = switchers();

    expect(plain.getAttribute('data-part')).toBe('trigger');
    expect(plain.getAttribute('type')).toBe('button');
    expect(plain.querySelector('[data-ui="icon"] > svg')?.getAttribute('data-glyph')).toBe(
      'chevron-down',
    );
    expect(plain.hasAttribute('aria-current')).toBe(false);
  });

  it('keeps aria-current and its own part beside the menu composed on it', () => {
    const { current, fixture } = switchers();

    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.getAttribute('aria-haspopup')).toBe('menu');
    expect(current.getAttribute('data-part')).toBe('trigger');

    current.click();
    fixture.detectChanges();
    TestBed.tick();

    expect(current.getAttribute('aria-expanded')).toBe('true');
    expect(current.hasAttribute('data-open')).toBe(true);
    expect(current.getAttribute('data-part')).toBe('trigger');
  });
});
