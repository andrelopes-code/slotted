import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChangeRequest } from '@slotted/core/state';
import { SlTabs } from './tabs';
import type { TabsDismissRequest } from './tabs';
import { provideTabsDefaults } from './tabs-defaults';
import {
  SlTab,
  SlTabActions,
  SlTabEnd,
  SlTabList,
  SlTabPanel,
  SlTabPanelContent,
  SlTabStart,
} from './tabs-parts';

@Component({
  standalone: true,
  imports: [SlTabs, SlTabList, SlTab, SlTabPanel, SlTabActions],
  template: `<div
    slTabs
    [defaultValue]="defaultValue()"
    [value]="value()"
    [activation]="activation()"
    [orientation]="orientation()"
    [mount]="mount()"
    [disabled]="disabled()"
    (valueChange)="requests.push($event); onChange($event)"
    (tabDismiss)="dismissals.push($event); onDismiss($event)"
  >
    <div slTabList aria-label="Order">
      @for (item of items(); track item) {
        <div
          slTab
          [value]="item"
          [disabled]="item === disabledValue()"
          [dismissible]="dismissible()"
          [dismissLabel]="'Close ' + item"
          [controls]="controls()"
        >
          {{ item }}
        </div>
      }
    </div>
    <div slTabActions>action</div>
    @for (item of items(); track item) {
      <div slTabPanel [value]="item">panel {{ item }}</div>
    }
  </div>`,
})
class Host {
  readonly items = signal(['a', 'b', 'c']);
  readonly defaultValue = signal<string | undefined>('a');
  readonly value = signal<string | undefined>(undefined);
  readonly activation = signal<'automatic' | 'manual' | undefined>(undefined);
  readonly orientation = signal<'horizontal' | 'vertical' | undefined>(undefined);
  readonly mount = signal<'active' | 'lazy' | 'eager' | undefined>(undefined);
  readonly disabled = signal(false);
  readonly disabledValue = signal<string | undefined>(undefined);
  readonly dismissible = signal(false);
  readonly controls = signal<string | undefined>(undefined);

  readonly requests: ChangeRequest<string | undefined>[] = [];
  readonly dismissals: TabsDismissRequest[] = [];
  onChange: (request: ChangeRequest<string | undefined>) => void = () => undefined;
  onDismiss: (request: TabsDismissRequest) => void = () => undefined;
}

describe('SlTabs', () => {
  let fixture: ComponentFixture<Host>;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const all = (selector: string) => [
    ...(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>),
  ];
  const tabs = () => all('[data-part="tab"]');
  const tab = (index: number) => tabs()[index] as HTMLElement;
  const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...init }));
  const click = (element: HTMLElement, detail = 1) =>
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('renders the pattern roles and wires each tab to its panel', () => {
    expect(query('[data-ui="tabs"]')).toBeTruthy();
    expect(query('[role="tablist"]')?.getAttribute('aria-label')).toBe('Order');
    expect(tab(0).getAttribute('aria-selected')).toBe('true');
    expect(tab(1).getAttribute('aria-selected')).toBe('false');

    const panel = query('[data-part="panel"]:not([hidden])') as HTMLElement;
    expect(tab(0).getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab(0).id);
    expect(panel.getAttribute('tabindex')).toBe('0');
  });

  /**
   * One marker the list draws, measured from the selected tab, rather than a
   * bar per item: one bar can slide between two tabs. `jsdom` lays nothing
   * out, so each tab's box is whatever the test says it is.
   */
  it('draws one marker in the list and moves it to the tab selected', async () => {
    const list = query('[role="tablist"]') as HTMLElement;
    const markers = () => list.querySelectorAll(':scope > [data-part="marker"]');
    expect(markers()).toHaveLength(1);
    const marker = markers()[0] as HTMLElement;
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    expect(marker.hidden).toBe(false);

    list.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 40 }) as DOMRect;
    tab(1).getBoundingClientRect = () => ({ left: 120, top: 0, width: 80, height: 40 }) as DOMRect;
    click(tab(1));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(markers()).toHaveLength(1);
    expect(marker.style.getPropertyValue('--_indicator-start')).toBe('120px');
    expect(marker.style.getPropertyValue('--_indicator-length')).toBe('80px');
  });

  /** A strip over one region the value filters names that region from every tab. */
  it('lets a tab name a region the family does not render', async () => {
    fixture.componentInstance.controls.set('feed');
    await fixture.whenStable();

    expect(tab(0).getAttribute('aria-controls')).toBe('feed');
    expect(tab(1).getAttribute('aria-controls')).toBe('feed');
  });

  it('holds one tab stop, on the selected tab', () => {
    expect(tab(0).getAttribute('tabindex')).toBe('0');
    expect(tab(1).getAttribute('tabindex')).toBe('-1');
  });

  it('moves and selects with the arrows, and wraps at both ends', async () => {
    tab(0).focus();
    press(tab(0), 'ArrowRight');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(1));
    expect(tab(1).getAttribute('aria-selected')).toBe('true');

    press(tab(1), 'ArrowLeft');
    await fixture.whenStable();
    press(tab(0), 'ArrowLeft');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(2));
  });

  /**
   * "If the tab list is horizontal, it does not listen for Down Arrow or Up
   * Arrow so those keys can provide their normal browser scrolling functions."
   */
  it('leaves the cross axis to the page in a horizontal list', async () => {
    tab(0).focus();
    press(tab(0), 'ArrowDown');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(0));
  });

  it('answers the cross axis instead when the list is vertical', async () => {
    fixture.componentInstance.orientation.set('vertical');
    await fixture.whenStable();

    expect(query('[role="tablist"]')?.getAttribute('aria-orientation')).toBe('vertical');
    tab(0).focus();
    press(tab(0), 'ArrowDown');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(1));
  });

  it('reaches both ends with Home and End', async () => {
    tab(0).focus();
    press(tab(0), 'End');
    await fixture.whenStable();
    expect(document.activeElement).toBe(tab(2));

    press(tab(2), 'Home');
    await fixture.whenStable();
    expect(document.activeElement).toBe(tab(0));
  });

  it('separates focus from selection under manual activation', async () => {
    fixture.componentInstance.activation.set('manual');
    await fixture.whenStable();

    tab(0).focus();
    press(tab(0), 'ArrowRight');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(1));
    expect(tab(1).getAttribute('aria-selected')).toBe('false');

    click(tab(1), 0);
    await fixture.whenStable();
    expect(tab(1).getAttribute('aria-selected')).toBe('true');
  });

  it('says why the value moved, and which device asked', async () => {
    click(tab(1));
    await fixture.whenStable();

    const [request] = fixture.componentInstance.requests;
    expect(request?.value).toBe('b');
    expect(request?.previous).toBe('a');
    expect(request?.reason).toBe('pointer');

    press(tab(1), 'ArrowRight');
    await fixture.whenStable();
    expect(fixture.componentInstance.requests[1]?.reason).toBe('keyboard');
  });

  it('lets the consumer refuse the change before anything moves', async () => {
    fixture.componentInstance.onChange = (request) => request.cancel();
    click(tab(1));
    await fixture.whenStable();

    expect(tab(0).getAttribute('aria-selected')).toBe('true');
  });

  it('waits for the consumer while the value is theirs', async () => {
    const host = fixture.componentInstance;
    host.value.set('a');
    host.onChange = (request) => host.value.set(request.value);
    await fixture.whenStable();

    click(tab(2));
    await fixture.whenStable();

    expect(host.value()).toBe('c');
    expect(tab(2).getAttribute('aria-selected')).toBe('true');
  });

  it('builds one panel at a time by default, and every one under eager', async () => {
    expect(
      all('[data-part="panel"]').filter((panel) => panel.textContent?.trim() !== ''),
    ).toHaveLength(1);

    fixture.componentInstance.mount.set('eager');
    await fixture.whenStable();

    expect(
      all('[data-part="panel"]').filter((panel) => panel.textContent?.trim() !== ''),
    ).toHaveLength(3);
    expect(all('[data-part="panel"]:not([hidden])')).toHaveLength(1);
  });

  it('keeps every panel once it has been seen, under lazy', async () => {
    fixture.componentInstance.mount.set('lazy');
    await fixture.whenStable();

    click(tab(1));
    await fixture.whenStable();

    expect(
      all('[data-part="panel"]').filter((panel) => panel.textContent?.trim() !== ''),
    ).toHaveLength(2);
  });

  it('skips a disabled tab with the arrows and refuses its click', async () => {
    fixture.componentInstance.disabledValue.set('b');
    await fixture.whenStable();

    tab(0).focus();
    press(tab(0), 'ArrowRight');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(2));
    expect(fixture.componentInstance.requests.at(-1)?.value).toBe('c');
  });

  it('reaches every tab with the native attribute when the family is out of action', async () => {
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();

    for (const item of tabs()) expect(item.hasAttribute('disabled')).toBe(true);
    expect(query('[data-ui="tabs"]')?.hasAttribute('data-disabled')).toBe(true);
  });

  /** The APG's own focus rule for `Delete`, applied to the value as well. */
  it('dismisses with Delete and leaves the selection to the neighbour', async () => {
    fixture.componentInstance.dismissible.set(true);
    await fixture.whenStable();

    expect(tab(0).getAttribute('aria-keyshortcuts')).toBe('Delete');
    tab(0).focus();
    press(tab(0), 'Delete');
    await fixture.whenStable();

    const [dismissal] = fixture.componentInstance.dismissals;
    expect(dismissal?.value).toBe('a');
    expect(dismissal?.reason).toBe('keyboard');
    expect(fixture.componentInstance.requests.at(-1)?.value).toBe('b');
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('remove');
  });

  it('does not repeat a dismissal while the key is held', async () => {
    fixture.componentInstance.dismissible.set(true);
    await fixture.whenStable();

    tab(0).focus();
    press(tab(0), 'Delete', { repeat: true });
    await fixture.whenStable();

    expect(fixture.componentInstance.dismissals).toHaveLength(0);
  });

  it('dismisses from the control without selecting the tab it closes', async () => {
    fixture.componentInstance.dismissible.set(true);
    await fixture.whenStable();

    const control = all('[data-part="dismiss"]')[1] as HTMLElement;
    expect(control.getAttribute('tabindex')).toBe('-1');
    expect(control.getAttribute('aria-label')).toBe('Close b');
    expect(control.querySelector('[data-ui="icon"] > svg[data-glyph="x"]')).not.toBeNull();

    click(control);
    await fixture.whenStable();

    expect(fixture.componentInstance.dismissals[0]?.value).toBe('b');
    expect(fixture.componentInstance.dismissals[0]?.reason).toBe('pointer');
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('lets a dismissal be refused', async () => {
    const host = fixture.componentInstance;
    host.dismissible.set(true);
    host.onDismiss = (request) => request.cancel();
    await fixture.whenStable();

    click(all('[data-part="dismiss"]')[0] as HTMLElement);
    await fixture.whenStable();

    expect(host.requests).toHaveLength(0);
  });

  it('records which way the selection travelled', async () => {
    const root = query('[data-ui="tabs"]') as HTMLElement;
    expect(root.getAttribute('data-activation-direction')).toBe('none');

    click(tab(2));
    await fixture.whenStable();
    expect(root.getAttribute('data-activation-direction')).toBe('forward');

    click(tab(0));
    await fixture.whenStable();
    expect(root.getAttribute('data-activation-direction')).toBe('backward');
  });

  it('finds a tab that arrives after the list was built', async () => {
    fixture.componentInstance.items.set(['a', 'b', 'c', 'd']);
    await fixture.whenStable();

    tab(0).focus();
    press(tab(0), 'End');
    await fixture.whenStable();

    expect(document.activeElement).toBe(tab(3));
  });

  it('takes the defaults an application sets once', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTabsDefaults({ size: 'sm', variant: 'contained' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.autoDetectChanges();
    await scoped.whenStable();

    const root = scoped.nativeElement.querySelector('[data-ui="tabs"]') as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.getAttribute('data-variant')).toBe('contained');
  });

  it('renders every part the contract names, less the two the layout decides', () => {
    const parts = new Set(all('[data-part]').map((node) => node.getAttribute('data-part')));
    for (const part of ['root', 'list', 'item', 'tab', 'label', 'panel', 'actions']) {
      expect(parts).toContain(part);
    }
  });
});

/** Counts the instances a panel builds, which is what `mount` is about. */
let built = 0;
let destroyed = 0;

@Component({ selector: 'app-heavy', standalone: true, template: `<textarea></textarea>` })
class Heavy {
  constructor() {
    built += 1;
    inject(DestroyRef).onDestroy(() => (destroyed += 1));
  }
}

@Component({
  standalone: true,
  imports: [SlTabs, SlTabList, SlTab, SlTabPanel, SlTabPanelContent, Heavy],
  template: `<div slTabs defaultValue="a" [mount]="mount()">
    <div slTabList aria-label="Order">
      <div slTab value="a">Summary</div>
      <div slTab value="b">Notes</div>
    </div>
    <div slTabPanel value="a">Summary</div>
    <div slTabPanel value="b">
      <ng-template slTabPanelContent><app-heavy /></ng-template>
    </div>
  </div>`,
})
class DeferredHost {
  readonly mount = signal<'active' | 'lazy' | 'eager'>('active');
}

describe('SlTabPanelContent', () => {
  let fixture: ComponentFixture<DeferredHost>;

  const tab = (index: number) =>
    fixture.nativeElement.querySelectorAll('[data-part="tab"]')[index] as HTMLElement;
  const select = async (index: number) => {
    tab(index).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
    );
    await fixture.whenStable();
  };

  async function create(mount: 'active' | 'lazy' | 'eager') {
    built = 0;
    destroyed = 0;
    TestBed.configureTestingModule({ imports: [DeferredHost] });
    fixture = TestBed.createComponent(DeferredHost);
    fixture.componentInstance.mount.set(mount);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  /** Projected markup is built by the consumer's view whether a panel shows it or not. */
  it('builds nothing for a closed panel under active, and a fresh instance on each selection', async () => {
    await create('active');
    expect(built).toBe(0);

    await select(1);
    expect(built).toBe(1);
    expect(fixture.nativeElement.querySelector('app-heavy')).toBeTruthy();

    await select(0);
    expect(destroyed).toBe(1);
    expect(fixture.nativeElement.querySelector('app-heavy')).toBeNull();

    await select(1);
    expect(built).toBe(2);
  });

  it('keeps the instance once built under lazy', async () => {
    await create('lazy');
    expect(built).toBe(0);

    await select(1);
    await select(0);
    await select(1);
    expect(built).toBe(1);
    expect(destroyed).toBe(0);
  });

  it('builds every panel up front under eager', async () => {
    await create('eager');
    expect(built).toBe(1);
  });
});

@Component({
  standalone: true,
  imports: [SlTabs, SlTabList, SlTab, SlTabStart, SlTabEnd, SlTabPanel],
  template: `<div slTabs defaultValue="orders">
    <div slTabList aria-label="Customer">
      <div slTab value="orders">
        <span slTabStart><i>icon</i></span>
        Orders
        <span slTabEnd><b>12</b></span>
      </div>
      <div slTab value="files" href="#files">
        <span slTabStart><i>icon</i></span>
        Files
      </div>
      <div slTab value="notes">Notes</div>
    </div>
    <div slTabPanel value="orders">Orders</div>
    <div slTabPanel value="files">Files</div>
    <div slTabPanel value="notes">Notes</div>
  </div>`,
})
class AdornedHost {}

describe('SlTabStart and SlTabEnd', () => {
  /** An icon and a count stand beside the words, inside the control. */
  it('places start and end beside the label, inside the tab', async () => {
    TestBed.configureTestingModule({ imports: [AdornedHost] });
    const fixture = TestBed.createComponent(AdornedHost);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const tabs = [
      ...(fixture.nativeElement.querySelectorAll('[data-part="tab"]') as NodeListOf<HTMLElement>),
    ];
    const parts = (element: HTMLElement) =>
      [...element.children].map((node) => node.getAttribute('data-part'));

    expect(parts(tabs[0] as HTMLElement)).toEqual(['start', 'label', 'end']);
    expect(tabs[0]?.querySelector('[data-part="label"]')?.textContent?.trim()).toBe('Orders');
    expect(tabs[0]?.querySelector('[data-part="end"] > b')?.textContent).toBe('12');
    expect(parts(tabs[1] as HTMLElement)).toEqual(['start', 'label']);
    expect(parts(tabs[2] as HTMLElement)).toEqual(['label']);
  });
});

describe('SlTabs overflow', () => {
  /**
   * A list laid out after mount — its stylesheet arriving late, a drawer
   * opening, a panel shown that was hidden — starts to overflow with the
   * selected tab out of sight. The tab is brought into view when the list
   * starts to overflow, not only when the selection moves.
   */
  it('brings the selected tab into view when the list starts to overflow', async () => {
    const resized: Array<() => void> = [];
    const Original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resized.push(() => callback([], this as unknown as ResizeObserver));
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    try {
      TestBed.configureTestingModule({ imports: [Host] });
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.defaultValue.set('c');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      const list = fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
      const third = fixture.nativeElement.querySelectorAll('[data-part="tab"]')[2] as HTMLElement;
      const scrollBy = vi.fn();
      Object.assign(list, { scrollBy });
      Object.defineProperty(list, 'clientWidth', { configurable: true, value: 200 });
      Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 480 });
      list.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 30 }) as DOMRect;
      third.getBoundingClientRect = () =>
        ({ left: 400, right: 480, top: 0, bottom: 30 }) as DOMRect;

      resized.forEach((notify) => notify());
      await fixture.whenStable();

      expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 280 }));
    } finally {
      globalThis.ResizeObserver = Original;
    }
  });
});
