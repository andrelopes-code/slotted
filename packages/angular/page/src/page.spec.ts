import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import {
  SlSection,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlPage, SlPageBody, SlPageFooter, STICKY_BOTTOM_PROPERTY } from './page';
import { providePageDefaults } from './page-defaults';

class FakeResizeObserver {
  static callbacks: ResizeObserverCallback[] = [];
  constructor(callback: ResizeObserverCallback) {
    FakeResizeObserver.callbacks.push(callback);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

@Component({
  standalone: true,
  imports: [
    SlPage,
    SlPageBody,
    SlPageFooter,
    SlSection,
    SlSectionHeader,
    SlSectionTitle,
    SlSectionHeading,
  ],
  template: `@if (main()) {
      <main
        slPage
        [width]="width()"
        [inset]="inset()"
        [scroll]="scroll()"
        [ground]="ground()"
        [fill]="fill()"
        [loading]="loading()"
      >
        <div slPageBody>
          <section slSection>
            <div slSectionHeader>
              <div slSectionTitle><h2 slSectionHeading>Order items</h2></div>
            </div>
          </section>
        </div>
        <footer slPageFooter [open]="footer()"><button type="button">Send</button></footer>
      </main>
    } @else {
      <div slPage [landmark]="landmark()"><div slPageBody>x</div></div>
    }`,
})
class Host {
  readonly main = signal(true);
  readonly landmark = signal<'main' | 'none' | undefined>(undefined);
  readonly width = signal<'measure' | 'content' | 'wide' | 'full' | undefined>(undefined);
  readonly inset = signal<0 | 4 | 6 | undefined>(undefined);
  readonly scroll = signal<'ancestor' | 'self' | undefined>(undefined);
  readonly ground = signal<'sunken' | 'surface' | undefined>(undefined);
  readonly fill = signal(false);
  readonly loading = signal(false);
  readonly footer = signal(true);
}

describe('SlPage', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const query = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement;
  const root = () => query('[data-ui="page"]');

  beforeEach(async () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    FakeResizeObserver.callbacks = [];
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders the anatomy the contract declares', () => {
    for (const part of ['root', 'scroll', 'body', 'footer', 'actions']) {
      expect(query(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().tagName).toBe('MAIN');
    expect(root().hasAttribute('role')).toBe(false);
  });

  it('adds role=main to an element that is not main, unless landmark says none', () => {
    host.main.set(false);
    fixture.detectChanges();
    expect(root().tagName).toBe('DIV');
    expect(root().getAttribute('role')).toBe('main');
    host.landmark.set('none');
    fixture.detectChanges();
    expect(root().hasAttribute('role')).toBe(false);
  });

  it('writes its axes and hands its measure to the body and the footer', () => {
    host.width.set('measure');
    host.inset.set(4);
    host.scroll.set('self');
    host.ground.set('surface');
    host.fill.set(true);
    fixture.detectChanges();
    expect(root().getAttribute('data-width')).toBe('measure');
    expect(root().getAttribute('data-scroll')).toBe('self');
    expect(root().getAttribute('data-ground')).toBe('surface');
    expect(root().hasAttribute('data-fill')).toBe(true);
    const body = query('[data-part="body"] > [data-ui="container"]');
    expect(body.getAttribute('data-size')).toBe('measure');
    expect(body.getAttribute('data-inset')).toBe('4');
    const footer = query('[data-part="footer"] > [data-ui="container"]');
    expect(footer.getAttribute('data-size')).toBe('measure');
  });

  it('steps the heading level for its body', () => {
    const heading = query('[data-part="heading"]');
    expect(heading.tagName).toBe('H2');
    expect(query('[data-ui="section"]').getAttribute('data-level')).toBe('2');
  });

  it('names the footer and holds it through its exit', async () => {
    const footer = query('[data-part="footer"]');
    expect(footer.getAttribute('aria-label')).toBe('Page actions');
    expect(footer.getAttribute('data-status')).toBe('open');
    expect(query('[data-part="footer"] [data-part="actions"]')).not.toBeNull();
    host.footer.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(['exiting', 'unmounted']).toContain(footer.getAttribute('data-status'));
  });

  it('carries aria-busy on the body while loading', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(query('[data-part="body"]').getAttribute('aria-busy')).toBe('true');
  });

  it('publishes the footer height on the document and removes it on destroy', () => {
    const footer = query('[data-part="footer"]');
    Object.defineProperty(footer, 'offsetHeight', { configurable: true, value: 56 });
    for (const callback of FakeResizeObserver.callbacks) callback([], {} as never);
    expect(document.documentElement.style.getPropertyValue(STICKY_BOTTOM_PROPERTY)).toBe('56px');
    fixture.destroy();
    expect(document.documentElement.style.getPropertyValue(STICKY_BOTTOM_PROPERTY)).toBe('');
  });
});

describe('SlPage defaults', () => {
  @Component({
    standalone: true,
    imports: [SlPage, SlPageBody, SlPageFooter],
    providers: [
      providePageDefaults({
        ground: 'surface',
        scroll: 'self',
        width: 'content',
      }),
    ],
    template: `<main slPage width="full" [messages]="{ footer: 'Decisions' }">
      <div slPageBody>x</div>
      <footer slPageFooter><button type="button">Send</button></footer>
    </main>`,
  })
  class Provided {}

  it('takes its defaults from the provider, and its own inputs over them', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const fixture = TestBed.createComponent(Provided);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="page"]') as HTMLElement;
    expect(root.getAttribute('data-ground')).toBe('surface');
    expect(root.getAttribute('data-scroll')).toBe('self');
    expect(root.getAttribute('data-width')).toBe('full');
    expect(root.querySelector('[data-part="footer"]')?.getAttribute('aria-label')).toBe(
      'Decisions',
    );
    vi.unstubAllGlobals();
  });
});

describe('SlPage language', () => {
  @Component({
    standalone: true,
    imports: [SlPage, SlPageBody, SlPageFooter],
    template: `<main slPage>
        <div slPageBody>x</div>
        <footer slPageFooter id="inside"><button type="button">Send</button></footer>
      </main>
      <footer slPageFooter id="alone"></footer>`,
  })
  class Spoken {}

  it('speaks the language in force, inside a page and outside one, and follows a change of it', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(Spoken);
    fixture.detectChanges();
    const label = (id: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)?.getAttribute('aria-label');
    // language: pt-BR
    expect(label('inside')).toBe('Ações da página');
    expect(label('alone')).toBe('Ações da página');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(label('inside')).toBe('Page actions');
    vi.unstubAllGlobals();
  });
});

@Component({
  standalone: true,
  imports: [SlPage, SlPageBody],
  template: `@if (bare()) {
      <main slPage><p>Content</p></main>
    } @else {
      <main slPage>
        <div slPageBody><p>Content</p></div>
      </main>
    }`,
})
class BodyHost {
  readonly bare = signal(true);
}

/**
 * The inset lives on the body, so a page whose content sits straight in it is
 * drawn against the viewport's edges. Nothing said why until the page said it.
 */
describe('SlPage without a body', () => {
  it('warns once, naming slPageBody, and stays quiet when the body is there', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const bare = TestBed.createComponent(BodyHost);
    bare.detectChanges();
    await bare.whenStable();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('slPageBody');

    warn.mockClear();
    const wrapped = TestBed.createComponent(BodyHost);
    wrapped.componentInstance.bare.set(false);
    wrapped.detectChanges();
    await wrapped.whenStable();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
