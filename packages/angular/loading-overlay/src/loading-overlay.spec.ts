import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/loading-overlay/contract.json';
import { SlLoadingOverlay, SlLoadingOverlayCancel } from './loading-overlay';
import { provideLoadingOverlayDefaults } from './loading-overlay-defaults';
import type { LoadingOverlayCancelRequest } from './loading-overlay.constants';

const defaults = contract.members.loadingOverlay.defaults;

@Component({
  imports: [SlLoadingOverlay],
  template: `<section
    slLoadingOverlay
    [loading]="loading()"
    [scope]="scope()"
    [veil]="veil()"
    [size]="size()"
    [live]="live()"
    [messages]="messages()"
    [loadedLabel]="loadedLabel()"
    [description]="description()"
    [cancellable]="cancellable()"
    [delay]="delay()"
    [minDuration]="minDuration()"
    (cancel)="onCancel($event)"
    (reveal)="onReveal()"
  >
    <input aria-label="Street address" />
    <button type="button">Save</button>
  </section>`,
})
class TestHost {
  readonly loading = signal(true);
  readonly scope = signal<'region' | 'page'>('region');
  readonly veil = signal<'wash' | 'blur' | 'none' | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly live = signal<'polite' | 'off' | undefined>(undefined);
  readonly messages = signal<{ label: string } | undefined>(undefined);
  readonly loadedLabel = signal<string | undefined>(undefined);
  readonly description = signal<string | undefined>(undefined);
  readonly cancellable = signal(false);
  readonly delay = signal<number | undefined>(undefined);
  readonly minDuration = signal<number | undefined>(undefined);

  readonly cancels: LoadingOverlayCancelRequest[] = [];
  readonly reveals = signal(0);

  onCancel(request: LoadingOverlayCancelRequest) {
    this.cancels.push(request);
  }
  onReveal() {
    this.reveals.update((count) => count + 1);
  }
}

/**
 * The inputs are set before the first change detection, because the timing
 * machine starts on it: a `delay` written after the first `detectChanges` is a
 * delay the layer has already run past.
 */
function mount(setup?: (host: TestHost) => void, providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  setup?.(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

const query = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector);
const root = () => query('[data-ui="loading-overlay"][data-part="root"]')!;
const content = () => query('[data-part="content"]')!;
const announcement = () => query('[data-part="announcement"]');
const cancel = () => query<HTMLButtonElement>('[data-part="cancel"]');

describe('SlLoadingOverlay', () => {
  it('is selected in public by the family identifier and carries the declared defaults', () => {
    mount();

    expect(root().getAttribute('data-ui')).toBe('loading-overlay');
    expect(root().getAttribute('data-part')).toBe('root');
    expect(root().getAttribute('data-scope')).toBe(defaults.scope);
    expect(root().getAttribute('data-size')).toBe(defaults.size);
    expect(root().getAttribute('data-veil')).toBe(defaults.veil);
  });

  /** The element stays the consumer's: the selector is a bare attribute. */
  it('renders no element of its own around the region', () => {
    mount();

    expect(root().tagName).toBe('SECTION');
  });

  /**
   * The whole claim of the family: the content is still there, still measured,
   * and still the thing the region's geometry comes from.
   */
  it('keeps the projected content in the document and takes it out of reach', () => {
    const fixture = mount();

    expect(query('input[aria-label="Street address"]')).not.toBeNull();
    expect(content().hasAttribute('inert')).toBe(true);
    expect(root().getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(query('input[aria-label="Street address"]')).not.toBeNull();
    expect(content().hasAttribute('inert')).toBe(false);
    expect(root().hasAttribute('aria-busy')).toBe(false);
  });

  it('never marks the root or the layer inert', () => {
    const fixture = mount();
    fixture.componentInstance.cancellable.set(true);
    fixture.detectChanges();

    expect(root().hasAttribute('inert')).toBe(false);
    expect(query('[data-part="scrim"]')!.hasAttribute('inert')).toBe(false);
    expect(cancel()).not.toBeNull();
  });

  it('announces the wait once, and empties the region rather than replacing it', () => {
    const fixture = mount();
    fixture.componentInstance.messages.set({ label: 'Saving changes' });
    fixture.detectChanges();

    expect(announcement()!.getAttribute('role')).toBe('status');
    expect(announcement()!.textContent?.trim()).toBe('Saving changes');

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(announcement()!.textContent?.trim()).toBe('');
  });

  it('says a second thing only when asked to', () => {
    const fixture = mount();
    fixture.componentInstance.loadedLabel.set('Changes saved');
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(announcement()!.textContent?.trim()).toBe('Changes saved');
  });

  it('renders no live region at all when the page announces the wait elsewhere', () => {
    const fixture = mount();
    fixture.componentInstance.live.set('off');
    fixture.detectChanges();

    expect(announcement()).toBeNull();
  });

  it('paints the two lines and hides them from the tree', () => {
    const fixture = mount();
    fixture.componentInstance.messages.set({ label: 'Saving changes' });
    fixture.componentInstance.description.set('About a minute left.');
    fixture.detectChanges();

    expect(query('[data-part="label"]')!.getAttribute('aria-hidden')).toBe('true');
    expect(query('[data-part="description"]')!.getAttribute('aria-hidden')).toBe('true');
  });

  describe('cancellation', () => {
    it('renders no control until one is asked for', () => {
      mount();

      expect(cancel()).toBeNull();
    });

    it('asks to stop and commits nothing', () => {
      const fixture = mount();
      fixture.componentInstance.cancellable.set(true);
      fixture.detectChanges();

      cancel()!.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.cancels).toHaveLength(1);
      expect(fixture.componentInstance.cancels[0]?.reason).toBe('dismiss');
      /* The layer is still up: only the application knows the work has stopped. */
      expect(root().hasAttribute('data-loading')).toBe(true);
      expect(content().hasAttribute('inert')).toBe(true);
    });

    it('takes Escape inside the layer, carrying the key as the reason', () => {
      const fixture = mount();
      fixture.componentInstance.cancellable.set(true);
      fixture.detectChanges();

      cancel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.componentInstance.cancels[0]?.reason).toBe('escape');
    });

    it('leaves Escape alone when there is nothing to ask for', () => {
      const fixture = mount();

      query('[data-part="scrim"]')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.cancels).toHaveLength(0);
    });
  });

  describe('focus', () => {
    it('moves focus out of the content before it goes inert, and puts it back', () => {
      const fixture = mount();
      fixture.componentInstance.loading.set(false);
      fixture.componentInstance.cancellable.set(true);
      fixture.detectChanges();

      const field = query<HTMLInputElement>('input[aria-label="Street address"]')!;
      field.focus();
      expect(document.activeElement).toBe(field);

      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();

      expect(document.activeElement).toBe(cancel());

      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(field);
    });

    it('takes the panel itself when there is no control to take', () => {
      const fixture = mount();
      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();

      query<HTMLInputElement>('input[aria-label="Street address"]')!.focus();

      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();

      expect(document.activeElement).toBe(query('[data-part="panel"]'));
    });

    /** A background save does not take the caret out of another form. */
    it('moves nothing when focus was never inside the covered content', () => {
      const fixture = mount();
      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();

      const outside = document.createElement('input');
      document.body.append(outside);
      outside.focus();

      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();

      expect(document.activeElement).toBe(outside);
      outside.remove();
    });
  });

  describe('timing', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('paints nothing until the wait has lasted long enough to report', () => {
      const fixture = mount((host) => host.delay.set(200));

      expect(root().hasAttribute('data-loading')).toBe(false);

      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(root().hasAttribute('data-loading')).toBe(true);
    });

    it('holds a layer that did appear, and reports the withdrawal rather than the input', () => {
      const fixture = mount((host) => host.minDuration.set(400));

      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();

      expect(root().hasAttribute('data-loading')).toBe(true);
      expect(fixture.componentInstance.reveals()).toBe(0);

      vi.advanceTimersByTime(400);
      fixture.detectChanges();

      expect(root().hasAttribute('data-loading')).toBe(false);
      expect(fixture.componentInstance.reveals()).toBe(1);
    });
  });

  describe('page scope', () => {
    it('covers no region of its own and claims no busy region', () => {
      const fixture = mount();
      fixture.componentInstance.scope.set('page');
      fixture.detectChanges();

      expect(query('[data-part="content"]')).toBeNull();
      expect(root().hasAttribute('aria-busy')).toBe(false);
      expect(root().getAttribute('data-scope')).toBe('page');
    });

    /**
     * `aria-modal` inherits only into `dialog` and `alertdialog`, and this
     * layer is neither. What it does instead is what ARIA 1.2 asks of a modal
     * element: make the rest of the document inert.
     */
    it('writes no aria-modal and no dialog role', () => {
      const fixture = mount();
      fixture.componentInstance.scope.set('page');
      fixture.detectChanges();

      expect(root().hasAttribute('aria-modal')).toBe(false);
      expect(root().hasAttribute('role')).toBe(false);
    });
  });

  describe('composition', () => {
    it('lets an application decide once, and an input still win', () => {
      const fixture = mount(undefined, [
        provideLoadingOverlayDefaults({ size: 'sm', veil: 'blur' }),
      ]);

      expect(root().getAttribute('data-size')).toBe('sm');
      expect(root().getAttribute('data-veil')).toBe('blur');

      fixture.componentInstance.veil.set('none');
      fixture.detectChanges();

      expect(root().getAttribute('data-veil')).toBe('none');
    });

    it('speaks the language in force, and follows a change of it in place', () => {
      const locale = signal('pt-BR');
      const fixture = mount(
        (host) => host.cancellable.set(true),
        [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
      );

      expect(announcement()!.textContent?.trim()).toBe('Carregando…');
      expect(cancel()!.textContent?.trim()).toBe('Cancelar');

      locale.set('en-US');
      fixture.detectChanges();
      expect(announcement()!.textContent?.trim()).toBe('Loading…');
      expect(cancel()!.textContent?.trim()).toBe('Cancel');
    });
  });
});

@Component({
  imports: [SlLoadingOverlay, SlLoadingOverlayCancel],
  template: `<div slLoadingOverlay cancellable (cancel)="asks = asks + 1">
    <button slLoadingOverlayCancel type="button">Interromper</button>
    <p>rows</p>
  </div>`,
})
class ProjectedCancelHost {
  asks = 0;
}

describe('SlLoadingOverlayCancel', () => {
  it('takes the part and the press from the consumer’s own control', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(ProjectedCancelHost);
    fixture.detectChanges();

    const control = document.querySelector<HTMLButtonElement>('[data-part="cancel"]')!;
    expect(control.textContent?.trim()).toBe('Interromper');

    control.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.asks).toBe(1);
  });
});
