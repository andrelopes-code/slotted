import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChangeRequest } from '@slotted/core/state';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import {
  SlPageHeader,
  SlPageHeaderHeading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlDetailPanel, SlDetailPanelSection } from './detail-panel';
import { provideDetailPanelDefaults } from './detail-panel-defaults';
import type {
  DetailPanelAside,
  DetailPanelLayout,
  DetailPanelLevel,
  DetailPanelMount,
  DetailPanelStatus,
} from './detail-panel-defaults';
import {
  SlDetailPanelAside,
  SlDetailPanelBanner,
  SlDetailPanelBody,
  SlDetailPanelFooter,
  SlDetailPanelMessage,
  SlDetailPanelTabs,
} from './detail-panel-parts';

class FakeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const PARTS = [
  SlDetailPanel,
  SlDetailPanelSection,
  SlDetailPanelBody,
  SlDetailPanelAside,
  SlDetailPanelBanner,
  SlDetailPanelMessage,
  SlDetailPanelFooter,
  SlDetailPanelTabs,
  SlPageHeader,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlPageHeaderTitle,
  SlPageHeaderHeading,
];

@Component({
  standalone: true,
  imports: PARTS,
  template: `<article
    slDetailPanel
    #panel="slDetailPanel"
    [layout]="layout()"
    [aside]="aside()"
    [level]="level()"
    [mount]="mount()"
    [status]="status()"
    [loading]="loading()"
    [recordKey]="recordKey()"
    [(section)]="section"
    (sectionRequest)="requests.push($event)"
  >
    <header slPageHeader [level]="headerLevel()">
      <div slPageHeaderTitleArea>
        <div slPageHeaderTitleRow>
          <div slPageHeaderTitle>
            <h2 slPageHeaderHeading>SO-2026-01842 · Meridian Controls Group</h2>
          </div>
        </div>
      </div>
      <div slDetailPanelTabs label="Order sections"></div>
    </header>
    <div slDetailPanelBody>
      @if (banner()) {
        <div slDetailPanelBanner>Changed by someone else</div>
      }
      <ng-template
        slDetailPanelSection
        name="linhas"
        label="Lines"
        [count]="4"
        [actions]="exportar"
      >
        <p>Servo Motor MX-240</p>
      </ng-template>
      <ng-template slDetailPanelSection name="historico" label="History">
        <p>Order created</p>
      </ng-template>
      <ng-template #exportar><button type="button">Exportar</button></ng-template>
      @if (withAside()) {
        <aside slDetailPanelAside [attr.aria-label]="asideLabel()"><dl>Priya Raman</dl></aside>
      }
      <div slDetailPanelMessage><p>This order no longer exists</p></div>
    </div>
    @if (footer()) {
      <footer slDetailPanelFooter><button type="button">Close</button></footer>
    }
  </article>`,
})
class Host {
  readonly layout = signal<DetailPanelLayout | undefined>(undefined);
  readonly aside = signal<DetailPanelAside | undefined>(undefined);
  readonly level = signal<DetailPanelLevel | undefined>(undefined);
  readonly headerLevel = signal<'1' | '2' | '3' | undefined>(undefined);
  readonly mount = signal<DetailPanelMount | undefined>(undefined);
  readonly status = signal<DetailPanelStatus>('ready');
  readonly loading = signal(false);
  readonly recordKey = signal<string | undefined>('SO-2026-01842');
  readonly banner = signal(false);
  readonly footer = signal(false);
  readonly withAside = signal(true);
  readonly asideLabel = signal<string | null>(null);
  section: string | undefined = undefined;
  readonly requests: ChangeRequest<string | undefined>[] = [];
}

describe('SlDetailPanel', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const all = (selector: string) =>
    Array.from(fixture.nativeElement.querySelectorAll(selector)) as HTMLElement[];
  const one = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement;
  const root = () => one('[data-ui="detail-panel"]');
  const sections = () => all('[data-part="section"]');
  const tabs = () => all('[role="tab"]');
  const panel = () =>
    fixture.debugElement.children[0]?.injector.get(SlDetailPanel) as SlDetailPanel;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    Element.prototype.scrollIntoView = vi.fn();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the anatomy the contract declares, as an article named by the heading', async () => {
    host.footer.set(true);
    host.banner.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    for (const part of ['body', 'banner', 'columns', 'main', 'section', 'aside', 'footer']) {
      expect(one(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().tagName).toBe('ARTICLE');
    expect(root().dataset['key']).toBe('SO-2026-01842');
    expect(root().firstElementChild?.getAttribute('data-ui')).toBe('page-header');
    const heading = one('[data-ui="page-header"] [data-part="heading"]');
    expect(heading.id).toBeTruthy();
    fixture.detectChanges();
    expect(root().getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('carries the defaults the contract declares', () => {
    expect(root().dataset['layout']).toBe('stacked');
    expect(root().dataset['aside']).toBe('end');
    expect(root().dataset['level']).toBe('2');
    expect(root().dataset['size']).toBe('md');
    expect(root().dataset['scroll']).toBe('ancestor');
    expect(root().dataset['mount']).toBe('active');
    expect(root().dataset['status']).toBe('ready');
    expect(root().hasAttribute('data-loading')).toBe(false);
  });

  it('provides the page-header defaults from its own level, and lets the header win', () => {
    const header = () => one('[data-ui="page-header"]');
    expect(header().dataset['level']).toBe('2');
    host.level.set('3');
    fixture.detectChanges();
    expect(header().dataset['level']).toBe('3');
    host.headerLevel.set('1');
    fixture.detectChanges();
    expect(header().dataset['level']).toBe('1');
  });

  it('stacks the sections as section family roots one rank below the panel, with the count as a badge', () => {
    const stacked = sections();
    expect(stacked).toHaveLength(2);
    for (const section of stacked) {
      expect(section.getAttribute('role')).toBeNull();
      expect(section.hidden).toBe(false);
      expect(section.querySelector('[data-ui="section"]')?.getAttribute('data-level')).toBe('3');
    }
    const heading = stacked[0]?.querySelector('[data-ui="section"] [data-part="heading"]');
    expect(heading?.textContent).toContain('Lines');
    expect(heading?.getAttribute('aria-level')).toBe('3');
    expect(stacked[0]?.querySelector('[data-ui="badge"]')?.textContent).toBe('4');
    /* The count is the section's tag, outside the heading and its name. */
    const badge = stacked[0]?.querySelector('[data-ui="badge"]');
    expect(heading?.contains(badge ?? null)).toBe(false);
    expect(badge?.closest('[data-part="tags"]')).not.toBeNull();
    expect(
      stacked[0]?.querySelector('[data-ui="section"] [data-part="actions"] button'),
    ).not.toBeNull();
    expect(one('[role="tablist"]')).toBeNull();
    expect(one('[data-ui="page-header"] [data-part="tabs"]')).not.toBeNull();
  });

  it('under tabs renders the strip from the sections and wires each section as its tab’s panel', () => {
    host.layout.set('tabs');
    fixture.detectChanges();
    fixture.detectChanges();
    expect(tabs().map((tab) => tab.textContent?.replace(/\s+/g, ''))).toEqual([
      'Lines4',
      'History',
    ]);
    const [first, second] = sections();
    expect(first?.getAttribute('role')).toBe('tabpanel');
    expect(first?.tabIndex).toBe(0);
    expect(first?.hidden).toBe(false);
    expect(first?.hasAttribute('data-current')).toBe(true);
    expect(second?.hidden).toBe(true);
    expect(tabs()[0]?.getAttribute('aria-controls')).toBe(first?.id);
    expect(first?.getAttribute('aria-labelledby')).toBe(tabs()[0]?.id);
    expect(first?.querySelector('[data-part="section-actions"] button')).not.toBeNull();
    expect(first?.querySelector('[data-ui="section"]')).toBeNull();
    expect(tabs()[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('forwards the strip’s request with its reason, and moves only when not cancelled', () => {
    host.layout.set('tabs');
    fixture.detectChanges();
    fixture.detectChanges();
    (tabs()[1] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(host.requests).toHaveLength(1);
    expect(host.requests[0]).toMatchObject({
      value: 'historico',
      previous: 'linhas',
      reason: 'pointer',
    });
    expect(host.section).toBe('historico');
    expect(sections()[1]?.hidden).toBe(false);
    expect(sections()[0]?.hidden).toBe(true);

    const cancelling = (request: ChangeRequest<string | undefined>) => request.cancel();
    host.requests.push = (request) => {
      cancelling(request);
      return Array.prototype.push.call(host.requests, request);
    };
    (tabs()[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(host.section).toBe('historico');
    expect(sections()[1]?.hidden).toBe(false);
  });

  it('mounts a tabbed section’s content by the mount axis', () => {
    host.layout.set('tabs');
    fixture.detectChanges();
    expect(sections()[1]?.textContent?.trim()).toBe('');
    host.mount.set('eager');
    fixture.detectChanges();
    expect(sections()[1]?.textContent).toContain('Order created');
    host.mount.set('lazy');
    fixture.detectChanges();
    expect(sections()[1]?.textContent?.trim()).toBe('');
    panel().select('historico', 'keyboard');
    fixture.detectChanges();
    panel().select('linhas', 'keyboard');
    fixture.detectChanges();
    expect(sections()[1]?.textContent).toContain('Order created');
  });

  it('marks and scrolls a stacked section when the value arrives programmatically', async () => {
    const scrolls = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
    scrolls.mockClear();
    expect(sections().some((section) => section.hasAttribute('data-current'))).toBe(false);
    panel().scrollToSection('historico');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.requests[0]).toMatchObject({ value: 'historico', reason: 'programmatic' });
    expect(sections()[1]?.hasAttribute('data-current')).toBe(true);
    expect(scrolls).toHaveBeenCalledWith({ block: 'start' });
  });

  it('replaces the columns with the message when the record is not there, and keeps the chrome', () => {
    host.status.set('not-found');
    host.footer.set(true);
    fixture.detectChanges();
    expect(one('[data-part="columns"]')).toBeNull();
    expect(one('[data-part="message"]')?.textContent).toContain('no longer exists');
    expect(one('[data-ui="page-header"]')).not.toBeNull();
    expect(one('[data-part="footer"]')?.textContent?.trim()).toBe('Close');
    expect(root().dataset['status']).toBe('not-found');
  });

  it('draws skeleton lines in place of the content while loading, and keeps the tab labels', () => {
    host.layout.set('tabs');
    host.loading.set(true);
    fixture.detectChanges();
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(sections()[0]?.textContent).not.toContain('Servo Motor');
    expect(sections()[0]?.querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(one('[data-part="aside"] [data-ui="skeleton"]')).not.toBeNull();
    expect(tabs()).toHaveLength(2);
  });

  it('names the aside from messages and lets a consumer rename it', () => {
    const aside = () => one('[data-part="aside"]');
    expect(aside().tagName).toBe('ASIDE');
    expect(aside().getAttribute('aria-label')).toBe('Details');
  });

  it('renders no aside under aside="none"', () => {
    host.aside.set('none');
    fixture.detectChanges();
    expect(one('[data-part="aside"]')).toBeNull();
    expect(root().dataset['aside']).toBe('none');
  });

  it('moves focus to the heading when the record changes under it, and not otherwise', async () => {
    host.layout.set('tabs');
    fixture.detectChanges();
    const heading = () => one('[data-ui="page-header"] [data-part="heading"]');
    host.recordKey.set('SO-2026-01843');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).not.toBe(heading());
    (tabs()[0] as HTMLElement).focus();
    host.recordKey.set('SO-2026-01844');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(heading());
    expect(heading().getAttribute('tabindex')).toBe('-1');
  });
});

@Component({
  standalone: true,
  imports: PARTS,
  providers: [provideDetailPanelDefaults({ layout: 'tabs', aside: 'start' })],
  template: `<article slDetailPanel [messages]="{ aside: 'Campos' }">
    <header slPageHeader>
      <div slPageHeaderTitleArea>
        <div slPageHeaderTitleRow>
          <div slPageHeaderTitle><h2 slPageHeaderHeading>Titulo</h2></div>
        </div>
      </div>
      <div slDetailPanelTabs label="Sections"></div>
    </header>
    <div slDetailPanelBody>
      <ng-template slDetailPanelSection name="a" label="A"><p>a</p></ng-template>
      <aside slDetailPanelAside><dl>x</dl></aside>
    </div>
  </article>`,
})
class Provided {}

describe('provideDetailPanelDefaults', () => {
  it('sets the layout and the aside once for every panel under it, and yields to messages', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const fixture = TestBed.createComponent(Provided);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="detail-panel"]') as HTMLElement;
    expect(root.dataset['layout']).toBe('tabs');
    expect(root.dataset['aside']).toBe('start');
    expect(root.querySelector('[data-part="aside"]')?.getAttribute('aria-label')).toBe('Campos');
    expect(root.querySelector('[role="tablist"]')).not.toBeNull();
    vi.unstubAllGlobals();
  });
});

const panelLocale = signal('pt-BR');

@Component({
  standalone: true,
  imports: PARTS,
  providers: [provideSlotted({ locale: panelLocale, catalogs: { 'pt-BR': PT_BR } })],
  template: `<article slDetailPanel>
    <div slDetailPanelBody>
      <ng-template slDetailPanelSection name="a" label="A"><p>a</p></ng-template>
      <aside slDetailPanelAside><dl>x</dl></aside>
    </div>
  </article>`,
})
class Localized {}

describe('SlDetailPanel language', () => {
  it('speaks the language in force, and follows a change of it in place', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    panelLocale.set('pt-BR');
    const fixture = TestBed.createComponent(Localized);
    fixture.detectChanges();
    const aside = () =>
      (fixture.nativeElement as HTMLElement).querySelector('[data-part="aside"]') as HTMLElement;
    expect(aside().getAttribute('aria-label')).toBe('Detalhes');

    panelLocale.set('en-US');
    fixture.detectChanges();
    expect(aside().getAttribute('aria-label')).toBe('Details');
    vi.unstubAllGlobals();
  });
});
