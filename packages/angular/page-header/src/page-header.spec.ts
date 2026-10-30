import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import type { ChangeRequest } from '@slotted/core/state';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import { SlPageHeader } from './page-header';
import { providePageHeaderDefaults } from './page-header-defaults';
import {
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderBreadcrumbs,
  SlPageHeaderContent,
  SlPageHeaderControls,
  SlPageHeaderDescription,
  SlPageHeaderFigure,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderNavigation,
  SlPageHeaderPin,
  SlPageHeaderSubheading,
  SlPageHeaderTabs,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlPageHeaderToggle,
  SlPageHeaderVisual,
  SlPageHeaderProgress,
} from './page-header-parts';

class FakeIntersectionObserver {
  static last: FakeIntersectionObserver | undefined;
  readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.last = this;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as never);
  }
}

class FakeResizeObserver {
  static last: FakeResizeObserver | undefined;
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.last = this;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

const PARTS = [
  SlPageHeader,
  SlPageHeaderTitleArea,
  SlPageHeaderNav,
  SlPageHeaderBack,
  SlPageHeaderBreadcrumbs,
  SlPageHeaderTitleRow,
  SlPageHeaderVisual,
  SlPageHeaderTitle,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderSubheading,
  SlPageHeaderActions,
  SlPageHeaderNavigation,
  SlPageHeaderArea,
  SlPageHeaderFigure,
  SlPageHeaderContent,
  SlPageHeaderDescription,
  SlPageHeaderControls,
  SlPageHeaderToggle,
  SlPageHeaderPin,
  SlPageHeaderTabs,
];

@Component({
  standalone: true,
  imports: [...PARTS, SlPage],
  template: `<main slPage [width]="width()" [inset]="inset()">
    <header
      slPageHeader
      #header="slPageHeader"
      [(expanded)]="expanded"
      [(pinned)]="pinned"
      [size]="size()"
      [level]="level()"
      [collapse]="collapse()"
      [loading]="loading()"
      (expandedRequest)="expandedRequests.push($event)"
      (pinnedRequest)="pinnedRequests.push($event)"
    >
      <div slPageHeaderTitleArea>
        <div slPageHeaderNav>
          <a slPageHeaderBack href="#orders">Orders</a>
          <div slPageHeaderBreadcrumbs><nav aria-label="Breadcrumb"></nav></div>
        </div>
        <div slPageHeaderTitleRow>
          <span slPageHeaderVisual>AL</span>
          <div slPageHeaderTitle>
            @if (nativeHeading()) {
              <h1 slPageHeaderHeading>Purchase order</h1>
            } @else {
              <div slPageHeaderHeading>Purchase order</div>
            }
            <span slPageHeaderMarks>Under review</span>
            <p slPageHeaderSubheading>Aurora Logistics</p>
          </div>
          <div slPageHeaderActions><button type="button">Approve</button></div>
          <div slPageHeaderNavigation><button type="button">Seguinte</button></div>
        </div>
      </div>
      <div slPageHeaderArea>
        <div slPageHeaderFigure>photo</div>
        <div slPageHeaderContent>
          <p slPageHeaderDescription>Tire replenishment.</p>
          <button type="button">Filter</button>
        </div>
      </div>
      <div slPageHeaderControls>
        <button slPageHeaderToggle></button>
        <button slPageHeaderPin></button>
      </div>
      <div slPageHeaderTabs><div role="tablist" aria-label="Sections"></div></div>
    </header>
  </main>`,
})
class Host {
  readonly header = viewChild.required<SlPageHeader>('header');
  readonly expanded = signal(true);
  readonly pinned = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly level = signal<'1' | '2' | '3' | undefined>(undefined);
  readonly collapse = signal<'scroll' | 'manual' | undefined>(undefined);
  readonly loading = signal(false);
  readonly nativeHeading = signal(true);
  readonly width = signal<'measure' | 'content' | 'wide' | 'full' | undefined>(undefined);
  readonly inset = signal<0 | 4 | 6 | undefined>(undefined);
  readonly expandedRequests: ChangeRequest<boolean>[] = [];
  readonly pinnedRequests: ChangeRequest<boolean>[] = [];
}

describe('SlPageHeader', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const query = <T extends HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const root = () => query('[data-ui="page-header"]');
  const area = () => query('[data-part="header-area"]');
  const toggle = () => query<HTMLButtonElement>('[data-part="toggle"]');
  const pin = () => query<HTMLButtonElement>('[data-part="pin"]');
  const click = (element: HTMLElement, detail = 1) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    FakeIntersectionObserver.last = undefined;
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    /* The size observer's first report, after layout: the engine's first measurement. */
    FakeResizeObserver.last?.callback([], {} as ResizeObserver);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the anatomy the contract declares', () => {
    for (const part of [
      'root',
      'title-area',
      'nav',
      'back',
      'breadcrumbs',
      'title-row',
      'visual',
      'title',
      'heading',
      'marks',
      'subheading',
      'actions',
      'navigation',
      'header-area',
      'figure',
      'content',
      'description',
      'controls',
      'toggle',
      'pin',
      'tabs',
    ]) {
      expect(query(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().tagName).toBe('HEADER');
    expect(root().querySelector(':scope > [data-ui="container"]')).not.toBeNull();
  });

  it('writes the disclosure wiring on the toggle and names the region', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-controls')).toBe(area().id);
    expect(toggle().getAttribute('aria-label')).toBe('Collapse header');
    expect(
      toggle().querySelector('[data-ui="icon"] > svg[data-glyph="chevron-down"]'),
    ).not.toBeNull();
    /* The way back keeps its label, and draws a mirrored arrow before it. */
    const back = root().querySelector('[data-part="back"]') as HTMLElement;
    expect(back.firstElementChild?.getAttribute('data-ui')).toBe('icon');
    expect(back.firstElementChild?.hasAttribute('data-directional')).toBe(true);
    expect(back.querySelector('svg[data-glyph="arrow-left"]')).not.toBeNull();
    expect(back.textContent?.trim()).toBe('Orders');
    expect(area().getAttribute('role')).toBe('region');
    expect(area().getAttribute('aria-label')).toBe('Page header');
    expect(root().hasAttribute('data-expanded')).toBe(true);
  });

  it('collapses from the toggle with the reason the device gave', () => {
    click(toggle(), 1);
    expect(host.expandedRequests.at(-1)?.reason).toBe('pointer');
    expect(host.expanded()).toBe(false);
    expect(root().hasAttribute('data-expanded')).toBe(false);
    expect(toggle().getAttribute('aria-label')).toBe('Expand header');
    expect(area().hasAttribute('inert')).toBe(true);

    click(toggle(), 0);
    expect(host.expandedRequests.at(-1)?.reason).toBe('keyboard');
    expect(host.expanded()).toBe(true);
    expect(area().hasAttribute('inert')).toBe(false);
  });

  /**
   * Started inside the first render, the engine read the boxes of the page
   * just rendered and forced a synchronous layout of it on every route. The
   * first measurement waits for the size observer's first report.
   */
  it('reads no box while it renders, and measures on the first size report', async () => {
    const rects = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    const heights = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get');
    FakeIntersectionObserver.last = undefined;
    const second = TestBed.createComponent(Host);
    second.detectChanges();
    await second.whenStable();
    second.detectChanges();
    expect(rects).not.toHaveBeenCalled();
    expect(heights).not.toHaveBeenCalled();
    expect(FakeIntersectionObserver.last).toBeUndefined();

    FakeResizeObserver.last?.callback([], {} as ResizeObserver);
    expect(FakeIntersectionObserver.last).toBeDefined();
    second.destroy();
    rects.mockRestore();
    heights.mockRestore();
  });

  it('collapses with the reason scroll when the area leaves the scrollport, and writes the fact', () => {
    expect(FakeIntersectionObserver.last).toBeDefined();
    /* The document has scrolled: only then can the area have left. */
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
    FakeIntersectionObserver.last?.report(false);
    fixture.detectChanges();
    expect(host.expandedRequests.at(-1)?.reason).toBe('scroll');
    expect(host.expanded()).toBe(false);
    expect(root().hasAttribute('data-scrolled')).toBe(true);
    expect(area().hasAttribute('inert')).toBe(false);

    FakeIntersectionObserver.last?.report(true);
    fixture.detectChanges();
    expect(host.expanded()).toBe(true);
    expect(root().hasAttribute('data-scrolled')).toBe(false);
  });

  it('reveals in place when the toggle opens the area after the scroll has passed it', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
    FakeIntersectionObserver.last?.report(false);
    fixture.detectChanges();
    click(toggle());
    expect(root().hasAttribute('data-expanded')).toBe(true);
    expect(root().hasAttribute('data-revealed')).toBe(true);
    expect(root().hasAttribute('data-scrolled')).toBe(true);
  });

  it('pins as a pressed toggle button, and a pin opens a collapsed area', () => {
    click(toggle());
    expect(host.expanded()).toBe(false);
    const glyph = () =>
      pin().querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(pin().getAttribute('aria-pressed')).toBe('false');
    expect(glyph()).toBe('pin');
    click(pin());
    expect(host.pinnedRequests.at(-1)?.reason).toBe('pointer');
    expect(host.pinned()).toBe(true);
    expect(pin().getAttribute('aria-pressed')).toBe('true');
    expect(pin().hasAttribute('data-pressed')).toBe(true);
    expect(pin().getAttribute('aria-label')).toBe('Unpin header');
    expect(glyph()).toBe('pin-off');
    expect(host.expandedRequests.at(-1)?.reason).toBe('programmatic');
    expect(host.expanded()).toBe(true);
  });

  it('lets the pin go before collapsing by the toggle', () => {
    host.pinned.set(true);
    fixture.detectChanges();
    click(toggle());
    expect(host.pinnedRequests.at(-1)?.reason).toBe('programmatic');
    expect(host.pinned()).toBe(false);
    expect(host.expanded()).toBe(false);
  });

  it('lets a request be refused before anything commits', () => {
    host.expandedRequests.length = 0;
    const handle = host.header();
    const stop = handle.expandedRequest.subscribe((request) => request.cancel());
    click(toggle());
    expect(host.expanded()).toBe(true);
    stop.unsubscribe();
  });

  it('follows a value the template moved, with the reason programmatic for the engine', () => {
    host.expanded.set(false);
    fixture.detectChanges();
    expect(root().hasAttribute('data-expanded')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('moves from the instance with the reason programmatic', () => {
    host.header().collapseArea();
    fixture.detectChanges();
    expect(host.expandedRequests.at(-1)?.reason).toBe('programmatic');
    expect(host.expanded()).toBe(false);
    host.header().pin();
    fixture.detectChanges();
    expect(host.pinned()).toBe(true);
    expect(host.expanded()).toBe(true);
    host.header().unpin();
    fixture.detectChanges();
    expect(host.pinned()).toBe(false);
  });

  it('never moves expanded on scroll under manual collapse', async () => {
    FakeIntersectionObserver.last = undefined;
    host.collapse.set('manual');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root().getAttribute('data-collapse')).toBe('manual');
    /* The refresh rebuilt no observer for a manual header. */
    const rebuilt = FakeIntersectionObserver.last as FakeIntersectionObserver | undefined;
    if (rebuilt !== undefined) {
      const before = host.expandedRequests.length;
      rebuilt.report(false);
      expect(host.expandedRequests.length).toBe(before);
    }
  });

  it('adds heading semantics only when the element is not a heading', () => {
    const heading = query('[data-part="heading"]');
    expect(heading.tagName).toBe('H1');
    expect(heading.hasAttribute('role')).toBe(false);
    host.nativeHeading.set(false);
    host.level.set('2');
    fixture.detectChanges();
    const substitute = query('[data-part="heading"]');
    expect(substitute.tagName).toBe('DIV');
    expect(substitute.getAttribute('role')).toBe('heading');
    expect(substitute.getAttribute('aria-level')).toBe('2');
  });

  it("stands skeleton's text shape in for the words while loading", () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(query('[data-part="heading"] [data-ui="skeleton"]')).not.toBeNull();
    expect(query('[data-part="description"] [data-ui="skeleton"]')).not.toBeNull();
  });

  it('aligns its rows to the page around it', () => {
    host.width.set('measure');
    host.inset.set(4);
    fixture.detectChanges();
    const container = root().querySelector(':scope > [data-ui="container"]');
    expect(container?.getAttribute('data-size')).toBe('measure');
    expect(container?.getAttribute('data-inset')).toBe('4');
  });

  /**
   * Too much of the screen to hold: on a phone the pin is not offered, and a
   * header held when the fact turns true is let go.
   */
  it('writes data-tall in a phone-wide frame and lets a held one go', async () => {
    host.pinned.set(true);
    fixture.detectChanges();
    expect(root().hasAttribute('data-tall')).toBe(false);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    FakeResizeObserver.last?.callback([], {} as ResizeObserver);
    /* The engine publishes on the next frame. */
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.detectChanges();
    expect(root().hasAttribute('data-tall')).toBe(true);
    expect(host.pinned()).toBe(false);
    expect(host.pinnedRequests.at(-1)?.reason).toBe('programmatic');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });

  it('writes band by default, and data-stuck once the title area holds with the page scrolled', async () => {
    expect(root().getAttribute('data-variant')).toBe('band');
    /* Earlier cases leave the window scrolled: this one starts at rest. */
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.detectChanges();
    expect(root().hasAttribute('data-stuck')).toBe(false);
    const title = query('[data-part="title-area"]');
    vi.spyOn(title, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.detectChanges();
    expect(root().hasAttribute('data-stuck')).toBe(true);

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.detectChanges();
    expect(root().hasAttribute('data-stuck')).toBe(false);
  });

  /**
   * Below the compact size class the header is in the flow: the stylesheet
   * reads `data-compact` and takes the root out of `sticky`, and nothing is
   * left for another family to stop under.
   */
  it('writes data-compact in a frame below the compact size class, and takes it off above it', async () => {
    const width = { value: 390 };
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width.value });
    FakeResizeObserver.last?.callback([], {} as ResizeObserver);
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.detectChanges();
    expect(root().hasAttribute('data-compact')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--slotted-page-sticky-top')).toBe(
      '0px',
    );

    width.value = 1024;
    FakeResizeObserver.last?.callback([], {} as ResizeObserver);
    await new Promise((resolve) => setTimeout(resolve, 40));
    fixture.detectChanges();
    expect(root().hasAttribute('data-compact')).toBe(false);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });
});

/**
 * A page that fills does not scroll: a list inside its body does. The header
 * is given the body, so that list moving down past sixteen pixels snaps the
 * area shut and the same list back at its top opens it again.
 */
describe('SlPageHeader in a page that fills', () => {
  @Component({
    standalone: true,
    imports: [
      SlPage,
      SlPageBody,
      SlPageHeader,
      SlPageHeaderArea,
      SlPageHeaderControls,
      SlPageHeaderToggle,
    ],
    template: `<main slPage scroll="self" [fill]="fill()">
      <header slPageHeader [(expanded)]="expanded" (expandedRequest)="requests.push($event)">
        <div slPageHeaderArea></div>
        <div slPageHeaderControls><button slPageHeaderToggle></button></div>
      </header>
      <div slPageBody>
        <div id="list"></div>
        <textarea id="note"></textarea>
      </div>
    </main>`,
  })
  class Filled {
    readonly fill = signal(true);
    readonly expanded = signal(true);
    readonly requests: ChangeRequest<boolean>[] = [];
  }

  let fixture: ComponentFixture<Filled>;
  let host: Filled;

  const scrollList = (top: number, selector = '#list') => {
    const list = fixture.nativeElement.querySelector(selector) as HTMLElement;
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: top });
    list.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    fixture = TestBed.createComponent(Filled);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    FakeResizeObserver.last?.callback([], {} as ResizeObserver);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('collapses when a scroller in the body passes sixteen pixels, and re-opens at its top', () => {
    scrollList(10);
    expect(host.expanded()).toBe(true);

    scrollList(40);
    expect(host.expanded()).toBe(false);
    expect(host.requests.at(-1)?.reason).toBe('scroll');

    scrollList(0);
    expect(host.expanded()).toBe(true);
    expect(host.requests.at(-1)?.reason).toBe('scroll');
  });

  /** A note typed into the body scrolls its own text, not the content the header heads. */
  it('leaves the header alone when a textarea in the body scrolls', () => {
    scrollList(40, '#note');
    expect(host.expanded()).toBe(true);
    expect(host.requests).toEqual([]);
  });

  it('reads the page on every scroll, so a page that stops filling stops the snap', () => {
    host.fill.set(false);
    fixture.detectChanges();
    scrollList(40);
    expect(host.expanded()).toBe(true);
    expect(host.requests).toEqual([]);
  });
});

describe('SlPageHeader defaults', () => {
  @Component({
    standalone: true,
    imports: [SlPageHeader, SlPageHeaderArea, SlPageHeaderControls, SlPageHeaderToggle],
    providers: [
      providePageHeaderDefaults({
        collapse: 'manual',
        level: '2',
        material: true,
        size: 'lg',
        variant: 'floating',
      }),
    ],
    template: `<header slPageHeader size="sm" [messages]="{ collapse: 'Close' }">
      <div slPageHeaderArea></div>
      <div slPageHeaderControls><button slPageHeaderToggle></button></div>
    </header>`,
  })
  class Provided {}

  it('takes its defaults from the provider, and its own inputs over them', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const fixture = TestBed.createComponent(Provided);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="page-header"]') as HTMLElement;
    expect(root.getAttribute('data-collapse')).toBe('manual');
    expect(root.getAttribute('data-level')).toBe('2');
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.getAttribute('data-variant')).toBe('floating');
    expect(root.getAttribute('data-material')).toBe('');
    expect(root.querySelector('[data-part="toggle"]')?.getAttribute('aria-label')).toBe('Close');
    vi.unstubAllGlobals();
  });
});

describe('SlPageHeader language', () => {
  @Component({
    standalone: true,
    imports: [SlPageHeader, SlPageHeaderArea, SlPageHeaderControls, SlPageHeaderToggle],
    template: `<header slPageHeader>
      <div slPageHeaderArea></div>
      <div slPageHeaderControls><button slPageHeaderToggle></button></div>
    </header>`,
  })
  class Spoken {}

  it('speaks the language in force, and follows a change of it in place', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(Spoken);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="page-header"]') as HTMLElement;
    const toggle = () => root.querySelector('[data-part="toggle"]')?.getAttribute('aria-label');
    // language: pt-BR
    expect(toggle()).toBe('Recolher cabeçalho');
    expect(root.querySelector('[data-part="header-area"]')?.getAttribute('aria-label')).toBe(
      'Cabeçalho da página',
      // language: en-US
    );

    locale.set('en-US');
    fixture.detectChanges();
    expect(toggle()).toBe('Collapse header');
    vi.unstubAllGlobals();
  });
});

@Component({
  standalone: true,
  imports: [SlPageHeader, SlPageHeaderProgress],
  template: `<header slPageHeader>
    <div slPageHeaderProgress [delay]="0"></div>
  </header>`,
})
class RefreshingHeader {}

describe('a refresh on the edge of the chrome', () => {
  it('draws one bar at edge-end, named from the catalog, and writes no aria-busy of its own', () => {
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(RefreshingHeader);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const bar = root.querySelector('[data-part="progress"] > [data-ui="progress-indicator"]');
    expect(bar?.getAttribute('data-placement')).toBe('edge-end');
    expect(bar?.getAttribute('data-size')).toBe('sm');
    expect(bar?.hasAttribute('hidden')).toBe(false);
    expect(bar?.querySelector('[data-part="label"]')?.textContent?.trim()).toBe(
      // language: pt-BR
      'Atualizando página',
      // language: en-US
    );
    expect(root.querySelector('[aria-busy]')).toBeNull();
  });
});
