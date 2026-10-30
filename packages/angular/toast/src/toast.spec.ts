import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/toast/contract.json';
import { SlToastRegion } from './toast';
import { provideToastDefaults, SlToastService } from './toast-defaults';

@Component({
  standalone: true,
  imports: [SlToastRegion],
  template: `<button type="button">outside</button> <sl-toast-region attach="inline" />`,
})
class Host {
  readonly toasts = inject(SlToastService);
}

function render(providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const region = (fixture: { nativeElement: HTMLElement }) =>
  fixture.nativeElement.querySelector<HTMLElement>('[data-ui="toast"]') as HTMLElement;
const items = (fixture: { nativeElement: HTMLElement }) => [
  ...region(fixture).querySelectorAll<HTMLElement>('[data-part="item"]'),
];

beforeEach(() => {
  /* `presence` schedules the frame that turns an arriving message from closed
     into open, and completes an exit on a timer when the browser reports none. */
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SlToastRegion', () => {
  it('is a named landmark, and writes no live role anywhere', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ title: 'Draft saved' });
    fixture.detectChanges();

    const root = region(fixture);
    expect(root.tagName).toBe('SECTION');
    expect(root.getAttribute('role')).toBe('region');
    expect(root.getAttribute('aria-label')).toBe('Notifications');
    expect(root.querySelector('[aria-live]')).toBeNull();
    expect(root.querySelector('[role="alert"], [role="status"]')).toBeNull();
    expect(root.querySelector('[data-part="list"]')?.tagName).toBe('OL');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ title: 'Draft saved' });
    fixture.detectChanges();

    const defaults = contract.members.toast.defaults;
    const root = region(fixture);
    expect(root.getAttribute('data-placement')).toBe(defaults.placement);
    expect(root.getAttribute('data-stacking')).toBe(defaults.stacking);
    expect(items(fixture)[0]?.getAttribute('data-tone')).toBe(defaults.tone);
    expect(items(fixture)[0]?.getAttribute('data-variant')).toBe(defaults.variant);
  });

  it('draws the anatomy the contract declares', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({
      title: 'Message archived',
      description: 'Out of the inbox.',
      progress: true,
      duration: 4000,
    });
    fixture.detectChanges();

    const item = items(fixture)[0] as HTMLElement;
    const parts = [...item.children].map((child) => child.getAttribute('data-part'));
    expect(parts).toEqual(['icon', 'content', 'close', 'progress']);
    expect(item.querySelector('[data-part="title"]')?.textContent).toBe('Message archived');
  });

  /** The one number the bar and the clock share, so they cannot disagree. */
  it('publishes the duration and the play state the stylesheet reads', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ title: 'Exported', duration: 4000 });
    fixture.detectChanges();

    expect(items(fixture)[0]?.style.getPropertyValue('--slotted-toast-duration')).toBe('4000ms');
    expect(region(fixture).style.getPropertyValue('--slotted-toast-play-state')).toBe('running');

    region(fixture).dispatchEvent(new PointerEvent('pointerenter'));
    fixture.detectChanges();
    expect(region(fixture).style.getPropertyValue('--slotted-toast-play-state')).toBe('paused');
    expect(region(fixture).hasAttribute('data-expanded')).toBe(true);
  });

  it('holds the clock while the pointer is over the region', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ id: 'one', title: 'Draft saved', duration: 1000 });
    fixture.detectChanges();

    region(fixture).dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(items(fixture)).toHaveLength(1);

    region(fixture).dispatchEvent(new PointerEvent('pointerleave'));
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(items(fixture)[0]?.hasAttribute('data-open')).toBe(false);
  });
});

@Component({
  standalone: true,
  imports: [SlToastRegion],
  template: `<sl-toast-region />`,
})
class PortalHost {}

/**
 * The move into the portal is a change to the document the browser shows.
 * On the server the region stays where it was written: Angular's server
 * document is not the page, and a node moved out of its host is a node
 * hydration does not find where the view left it.
 */
describe('the portal', () => {
  const mount = (platform: 'browser' | 'server') => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    const fixture = TestBed.createComponent(PortalHost);
    fixture.detectChanges();
    return fixture;
  };

  it('moves the region to the end of the document in the browser', () => {
    const fixture = mount('browser');
    expect(fixture.nativeElement.querySelector('[data-ui="toast"]')).toBeNull();
    expect(document.querySelector('[data-slotted-portal] [data-ui="toast"]')).not.toBeNull();
    fixture.destroy();
  });

  it('leaves the region in its host while rendering on the server', () => {
    const fixture = mount('server');
    const section = fixture.nativeElement.querySelector('[data-ui="toast"]') as HTMLElement;
    expect(section?.closest('sl-toast-region')).not.toBeNull();
    expect(section.getAttribute('data-attach')).toBe('portal');
    expect(document.querySelector('[data-slotted-portal] [data-ui="toast"]')).toBeNull();
    fixture.destroy();
  });

  it('binds no key to the server’s document', () => {
    const fixture = mount('server');
    TestBed.inject(SlToastService).show({ id: 'one', title: 'Draft saved' });
    fixture.detectChanges();
    const before = document.activeElement;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', bubbles: true }));
    expect(document.activeElement).toBe(before);
    fixture.destroy();
  });
});

describe('dismissal', () => {
  it('names the reason the message left', () => {
    const fixture = render();
    const reasons: string[] = [];
    fixture.componentInstance.toasts.store.onRequest((request) => reasons.push(request.reason));

    fixture.componentInstance.toasts.show({ id: 'one', title: 'Draft saved' });
    fixture.detectChanges();

    region(fixture).querySelector<HTMLButtonElement>('[data-part="close"]')?.click();
    expect(reasons.at(-1)).toBe('dismiss');
  });

  it('closes the message the keyboard is inside when Escape is pressed', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ id: 'one', title: 'Draft saved' });
    fixture.detectChanges();

    const item = items(fixture)[0] as HTMLElement;
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(item.hasAttribute('data-open')).toBe(false);
  });

  it('takes the message out of the document once its exit has finished', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ id: 'one', title: 'Draft saved' });
    fixture.detectChanges();
    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    fixture.componentInstance.toasts.dismiss('one');
    fixture.detectChanges();
    expect(items(fixture)).toHaveLength(1);

    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    expect(items(fixture)).toHaveLength(0);
  });
});

describe('the keyboard', () => {
  /**
   * The whole of this family's claim on the keyboard. The APG's Alert pattern
   * is explicit that an arriving message must not move focus, so the reader
   * moves it.
   */
  it('moves focus into the region on the hotkey, and never on its own', () => {
    const fixture = render();
    const outside = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    outside.focus();

    fixture.componentInstance.toasts.show({ id: 'one', title: 'Draft saved' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(outside);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', bubbles: true }));
    expect(document.activeElement).toBe(items(fixture)[0]);
  });
});

describe('what an application decides once', () => {
  it('reads the injection token for every axis a message did not state', () => {
    const locale = signal('pt-BR');
    const fixture = render([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
      provideToastDefaults({ placement: 'top-start', tone: 'success', variant: 'soft' }),
    ]);
    fixture.componentInstance.toasts.show({ title: 'Salvo' });
    fixture.detectChanges();

    const root = region(fixture);
    // language: pt-BR
    expect(root.getAttribute('aria-label')).toBe('Notificações');
    // language: en-US
    expect(root.getAttribute('data-placement')).toBe('top-start');
    expect(items(fixture)[0]?.getAttribute('data-tone')).toBe('success');
    expect(items(fixture)[0]?.getAttribute('data-variant')).toBe('soft');
    // language: pt-BR
    expect(root.querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('Fechar');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(root.getAttribute('aria-label')).toBe('Notifications');
    expect(root.querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('Close');
  });

  it('lets a message overrule the token it is under', () => {
    const fixture = render([provideToastDefaults({ tone: 'success' })]);
    fixture.componentInstance.toasts.show({ title: 'Falhou', tone: 'danger' });
    fixture.detectChanges();

    expect(items(fixture)[0]?.getAttribute('data-tone')).toBe('danger');
  });
});

describe('the marks', () => {
  const glyphIn = (item: HTMLElement | undefined, part: string) =>
    item?.querySelector(`[data-part="${part}"] > [data-ui="icon"] > svg[data-part="glyph"]`);

  it('draws each tone’s glyph from the contract’s map, and the close as the x glyph', () => {
    for (const [tone, glyph] of Object.entries(contract.toneGlyphs)) {
      const fixture = render();
      fixture.componentInstance.toasts.show({ title: tone, tone: tone as never });
      fixture.detectChanges();

      const item = items(fixture)[0];
      if (glyph === null) expect(item?.querySelector('[data-part="icon"]'), tone).toBeNull();
      else {
        expect(glyphIn(item, 'icon')?.getAttribute('data-glyph'), tone).toBe(glyph);
        expect(glyphIn(item, 'icon')?.hasAttribute('data-solid'), tone).toBe(true);
      }
      expect(glyphIn(item, 'close')?.getAttribute('data-glyph'), tone).toBe('x');
    }
  });

  it('draws the contained loader while a promise is in flight, and no tone glyph', () => {
    const fixture = render();
    fixture.componentInstance.toasts.show({ title: 'Saving', loading: true });
    fixture.detectChanges();

    const icon = items(fixture)[0]?.querySelector('[data-part="icon"]');
    const loader = icon?.querySelector('[data-ui="progress-indicator"]');
    expect(loader?.getAttribute('data-shape')).toBe('morph');
    expect(loader?.hasAttribute('data-contained')).toBe(true);
    expect(loader?.getAttribute('aria-hidden')).toBe('true');
    expect(loader?.hasAttribute('role')).toBe(false);
    expect(icon?.querySelector('svg[data-part="glyph"]')).toBeNull();
  });
});

describe('the pile', () => {
  it('measures each message at its own height, and writes the open pile’s whole height', () => {
    const heights = [70, 46, 46];
    class Observer {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        /* The closed pile draws every message at the front one's height; only
           with the override lifted does a message report its own. */
        const index = this.parentElement ? [...this.parentElement.children].indexOf(this) : -1;
        return { height: this.style.blockSize === 'auto' ? (heights[index] ?? 0) : 70 } as DOMRect;
      });

    const fixture = render([provideToastDefaults({ stacking: 'stack' })]);
    for (const id of ['a', 'b', 'c']) fixture.componentInstance.toasts.show({ id, title: id });
    fixture.detectChanges();
    TestBed.tick();

    /* No stylesheet in this document, so the list's gap reads as zero. */
    expect(
      items(fixture).map((item) => item.style.getPropertyValue('--slotted-toast-height')),
    ).toEqual(['70px', '46px', '46px']);
    expect(region(fixture).style.getPropertyValue('--slotted-toast-stack-height')).toBe('162px');
    expect(items(fixture).every((item) => item.style.blockSize === '')).toBe(true);
    rect.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('the service', () => {
  it('reads as signals, so a zoneless application renders on them', () => {
    const fixture = render();
    const service = fixture.componentInstance.toasts;

    expect(service.visible()).toHaveLength(0);
    service.show({ id: 'one', title: 'Draft saved' });
    expect(service.visible()).toHaveLength(1);
    expect(service.paused()).toBe(false);

    service.pauseAll();
    expect(service.paused()).toBe(true);
  });
});
