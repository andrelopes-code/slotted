import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/scroll-area/contract.json';
import { SlScrollArea, SlScrollAreaContent } from './scroll-area';
import { provideScrollAreaDefaults } from './scroll-area-defaults';
import type { ScrollAreaAxis, ScrollAreaFade } from './scroll-area-defaults';

/**
 * jsdom performs no layout, so a scrollport here never overflows unless it is
 * told its sizes. The viewport is the element the family measures, and the
 * host gives it a box and a content size before the first measurement runs.
 */
const TALL = { clientHeight: 200, scrollHeight: 800, clientWidth: 300, scrollWidth: 300 };
const FITS = { clientHeight: 200, scrollHeight: 200, clientWidth: 300, scrollWidth: 300 };

@Component({
  imports: [SlScrollArea, SlScrollAreaContent],
  template: `
    <h2 id="notas">Release notes</h2>
    <div
      slScrollArea
      #area="slScrollArea"
      class="frame"
      [axis]="axis()"
      [fade]="fade()"
      [messages]="messages()"
      [labelledBy]="labelledBy()"
      [maxBlockSize]="maxBlockSize()"
      [tabbable]="tabbable()"
      (scrollChange)="onScroll($event)"
      (overflowChange)="onOverflow($event)"
    >
      <div slScrollAreaContent>
        <p>An invoice issued before September 1 keeps the old tax lines.</p>
      </div>
    </div>
  `,
})
class Host {
  readonly area = viewChild.required<SlScrollArea>('area');
  readonly axis = signal<ScrollAreaAxis | undefined>(undefined);
  readonly fade = signal<ScrollAreaFade | undefined>(undefined);
  readonly messages = signal<{ label?: string } | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly maxBlockSize = signal<string | undefined>(undefined);
  readonly tabbable = signal(true);

  readonly onScroll = vi.fn();
  readonly onOverflow = vi.fn();
}

function mount(sizes: Record<string, number> = TALL, providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  /* Sizes go on before the first render, which is when the measurement runs. */
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector("[data-ui='scroll-area']") as HTMLElement;
  const viewport = root.querySelector("[data-part='viewport']") as HTMLElement;
  for (const [name, value] of Object.entries(sizes)) {
    Object.defineProperty(viewport, name, { value, configurable: true, writable: true });
  }
  fixture.componentInstance.area().refresh();
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, root, viewport };
}

describe('identity', () => {
  it('is selected by the identifier the contract declares, with the three parts', () => {
    const { root, viewport } = mount();

    expect(root.getAttribute('data-ui')).toBe(contract.ui);
    expect(root.getAttribute('data-part')).toBe('root');
    expect(viewport).not.toBeNull();
    expect(root.querySelector("[data-part='content']")).not.toBeNull();
  });

  it('keeps the consumer’s own element and class as the frame', () => {
    const { root } = mount();

    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('frame')).toBe(true);
  });

  it('writes every axis at its declared default', () => {
    const { root } = mount();
    const defaults = contract.members.scrollArea.defaults;

    expect(root.getAttribute('data-axis')).toBe(defaults.axis);
    expect(root.getAttribute('data-scrollbars')).toBe(defaults.scrollbars);
    expect(root.getAttribute('data-gutter')).toBe(defaults.gutter);
    expect(root.getAttribute('data-fade')).toBe(defaults.fade);
    expect(root.getAttribute('data-overscroll')).toBe(defaults.overscroll);
  });

  it('takes a default from the provider, and lets the instance win over it', () => {
    const { root, host, fixture } = mount(TALL, [
      provideScrollAreaDefaults({ axis: 'both', fade: 'end' }),
    ]);

    expect(root.getAttribute('data-axis')).toBe('both');
    expect(root.getAttribute('data-fade')).toBe('end');

    host.fade.set('none');
    fixture.detectChanges();
    expect(root.getAttribute('data-fade')).toBe('none');
  });

  it('writes the maximum as a style on the frame', () => {
    const { root, host, fixture } = mount();

    host.maxBlockSize.set('20rem');
    fixture.detectChanges();

    expect(root.style.maxBlockSize).toBe('20rem');
  });
});

describe('the measurement in the DOM', () => {
  it('names the overflowing axis and the ends that show', () => {
    const { root } = mount();

    expect(root.getAttribute('data-overflowing')).toBe('block');
    expect(root.hasAttribute('data-at-block-start')).toBe(true);
    expect(root.hasAttribute('data-at-block-end')).toBe(false);
    expect(root.hasAttribute('data-at-inline-start')).toBe(true);
    expect(root.hasAttribute('data-at-inline-end')).toBe(true);
  });

  it('shows every end of content that fits, and names no axis', () => {
    const { root } = mount(FITS);

    expect(root.hasAttribute('data-overflowing')).toBe(false);
    for (const edge of ['block-start', 'block-end', 'inline-start', 'inline-end']) {
      expect(root.hasAttribute(`data-at-${edge}`)).toBe(true);
    }
  });

  it('follows a scroll to the end', () => {
    const { root, viewport, fixture } = mount();

    viewport.scrollTop = 600;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(root.hasAttribute('data-at-block-start')).toBe(false);
    expect(root.hasAttribute('data-at-block-end')).toBe(true);
  });

  it('emits the measurement only when it changes', () => {
    const { host, viewport, fixture } = mount();
    host.onOverflow.mockClear();

    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.onOverflow).not.toHaveBeenCalled();

    viewport.scrollTop = 600;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.onOverflow).toHaveBeenCalledTimes(1);
    expect(host.onOverflow.mock.calls[0]?.[0].block.atEnd).toBe(true);
  });

  it('emits the position as a distance from each logical start, with the event', () => {
    const { host, viewport, fixture } = mount();

    viewport.scrollTop = 120;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(host.onScroll).toHaveBeenCalledTimes(1);
    expect(host.onScroll.mock.calls[0]?.[0].position).toEqual({ block: 120, inline: 0 });
    expect(host.onScroll.mock.calls[0]?.[0].source.type).toBe('scroll');
  });
});

/**
 * There is no APG pattern. The requirement is SC 2.1.1, tested by the
 * `scrollable-region-focusable` rule, and what the tab stop then owes is a
 * name — SC 4.1.2, which Base UI and Zag both answer with `role="presentation"`.
 */
/** A pointer press focuses the nearest focusable ancestor, as a browser does. */
const press = (target: Element) => {
  target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  target.closest<HTMLElement>('[tabindex], a[href], button')?.focus();
};
const key = (target: Element, name: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: name }));

describe('the region', () => {
  it('is a named region with a tab stop while the content overflows', () => {
    const { host, viewport, fixture } = mount();
    host.messages.set({ label: 'Release notes' });
    fixture.detectChanges();

    expect(viewport.getAttribute('role')).toBe('region');
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(viewport.getAttribute('aria-label')).toBe('Release notes');
  });

  it('draws its ring for a focus from the keyboard, and not for a click followed by Shift', () => {
    const { viewport } = mount();

    press(viewport.firstElementChild ?? viewport);
    key(viewport, 'Shift');
    expect(document.activeElement).toBe(viewport);
    expect(viewport.getAttribute('data-focus-origin')).not.toBe('keyboard');

    viewport.blur();
    key(document.body, 'Tab');
    viewport.focus();
    expect(viewport.getAttribute('data-focus-origin')).toBe('keyboard');
  });

  it('is nothing at all while the content fits', () => {
    const { host, viewport, fixture } = mount(FITS);
    host.messages.set({ label: 'Release notes' });
    fixture.detectChanges();

    expect(viewport.hasAttribute('role')).toBe(false);
    expect(viewport.hasAttribute('tabindex')).toBe(false);
    expect(viewport.hasAttribute('aria-label')).toBe(false);
  });

  it('is named by the element the consumer points at before by a string', () => {
    const { host, viewport, fixture } = mount();
    host.messages.set({ label: 'ignored' });
    host.labelledBy.set('notas');
    fixture.detectChanges();

    expect(viewport.getAttribute('aria-labelledby')).toBe('notas');
    expect(viewport.hasAttribute('aria-label')).toBe(false);
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { fixture, viewport } = mount(TALL, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);

    // language: pt-BR
    expect(viewport.getAttribute('aria-label')).toBe('Conteúdo rolável');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(viewport.getAttribute('aria-label')).toBe('Scrollable content');
  });

  it('leaves the tab sequence alone when the consumer says the content is reachable', () => {
    const { host, viewport, fixture } = mount();
    host.tabbable.set(false);
    fixture.detectChanges();

    expect(viewport.hasAttribute('tabindex')).toBe(false);
    expect(viewport.hasAttribute('role')).toBe(false);
  });
});

describe('the instance', () => {
  it('reaches both elements', () => {
    const { host, root, viewport } = mount();

    expect(host.area().root).toBe(root);
    expect(host.area().viewport).toBe(viewport);
  });

  it('moves the scrollport and only the scrollport', () => {
    const { host, viewport } = mount();
    const calls: ScrollToOptions[] = [];
    Object.defineProperty(viewport, 'scrollTo', {
      value: (options: ScrollToOptions) => calls.push(options),
      configurable: true,
    });

    host.area().scrollToEdge('block-end');
    host.area().scrollTo({ block: 50 });

    expect(calls).toEqual([
      expect.objectContaining({ top: 600 }),
      expect.objectContaining({ top: 50 }),
    ]);
  });

  it('focuses the scrollport', () => {
    const { host, viewport } = mount();

    host.area().focus();

    expect(document.activeElement).toBe(viewport);
  });

  it('answers the measurement', () => {
    const { host } = mount();

    expect(host.area().state().block).toEqual({ overflowing: true, atStart: true, atEnd: false });
    expect(host.area().position()).toEqual({ block: 0, inline: 0 });
  });
});
