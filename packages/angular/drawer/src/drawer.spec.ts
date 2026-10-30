import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/drawer/contract.json';
import { SlDrawer } from './drawer';
import { provideDrawerDefaults } from './drawer-defaults';
import type { DrawerChangeRequest, DrawerExtentRequest } from './drawer-defaults';
import {
  SlDrawerActions,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerResizer,
  SlDrawerTitle,
  SlDrawerTrigger,
} from './drawer-parts';

@Component({
  standalone: true,
  imports: [
    SlDrawer,
    SlDrawerTrigger,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerActions,
    SlDrawerDescription,
    SlDrawerBody,
    SlDrawerFooter,
    SlDrawerClose,
    SlDrawerResizer,
  ],
  template: `<button [slDrawerTrigger]="d">Open details</button>
    <sl-drawer
      #d="slDrawer"
      [(open)]="open"
      [(extent)]="extent"
      [mode]="mode()"
      [side]="side()"
      [size]="size()"
      [mount]="mount()"
      [modal]="modal()"
      [escape]="escape()"
      [loading]="loading()"
      [snapPoints]="snapPoints()"
      [drag]="drag()"
      [scrimFrom]="scrimFrom()"
      (openChangeRequest)="requests.push($event)"
      (extentChangeRequest)="extents.push($event)"
      (closed)="results.push($event)"
    >
      <header slDrawerHeader>
        <h2 slDrawerTitle>Invoice 4471</h2>
        <div slDrawerActions></div>
        @if (described()) {
          <p slDrawerDescription>Issued on 12 August.</p>
        }
        <button slDrawerClose [value]="'dismissed'"></button>
      </header>
      <div slDrawerBody [inset]="bodyInset()"><input aria-label="Note" /></div>
      <footer slDrawerFooter><button type="button">Cancel</button></footer>
      <div slDrawerResizer></div>
    </sl-drawer>`,
})
class DrawerHost {
  readonly open = signal(false);
  readonly bodyInset = signal<'none' | undefined>(undefined);
  readonly extent = signal<number | undefined>(undefined);
  readonly mode = signal<'overlay' | 'inline' | undefined>(undefined);
  readonly side = signal<'start' | 'end' | 'top' | 'bottom' | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | 'lg' | 'xl' | 'full' | 'content' | undefined>(undefined);
  readonly drag = signal<'panel' | 'resizer' | undefined>(undefined);
  readonly scrimFrom = signal(0);
  readonly mount = signal<'active' | 'lazy' | 'eager' | undefined>(undefined);
  readonly modal = signal(true);
  readonly escape = signal<'close' | 'none' | undefined>(undefined);
  readonly loading = signal(false);
  readonly described = signal(true);
  readonly snapPoints = signal<readonly number[]>([]);
  readonly requests: DrawerChangeRequest[] = [];
  readonly extents: DrawerExtentRequest[] = [];
  readonly results: (string | undefined)[] = [];
}

/**
 * jsdom implements pointer events and not pointer *capture*, and lays nothing
 * out, so both are filled in here rather than guarded in the family: a guard
 * would be production code shaped by the test environment.
 */
beforeAll(() => {
  const element = Element.prototype as unknown as Record<string, unknown>;
  element['setPointerCapture'] ??= () => {};
  element['releasePointerCapture'] ??= () => {};
  element['hasPointerCapture'] ??= () => true;
});

function measureAs(width: number, height: number) {
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      bottom: height,
      height,
      left: 0,
      right: width,
      toJSON: () => ({}),
      top: 0,
      width,
      x: 0,
      y: 0,
    }) as DOMRect;
}

describe('SlDrawer', () => {
  let fixture: ComponentFixture<DrawerHost>;
  let host: DrawerHost;

  const layer = () => document.querySelector('[data-ui="drawer"]') as HTMLElement | null;
  const panel = () => document.querySelector('[data-part="panel"]') as HTMLElement | null;
  const separator = () => document.querySelector('[data-part="resizer"]') as HTMLElement | null;
  const trigger = () => fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLElement;

  const press = (node: Element) => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
  };
  const key = (node: Element, value: string, init: KeyboardEventInit = {}) => {
    node.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value, ...init }),
    );
    fixture.detectChanges();
  };
  const escape = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }),
    );
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DrawerHost] });
    fixture = TestBed.createComponent(DrawerHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the anatomy the contract declares', () => {
    host.open.set(true);
    fixture.detectChanges();

    const parts = [...document.querySelectorAll('[data-part]')].map((node) =>
      node.getAttribute('data-part'),
    );
    for (const part of contract.members.drawer.parts) {
      expect(parts, `${part} is declared and never rendered`).toContain(part);
    }
    expect(layer()?.dataset['ui']).toBe('drawer');
  });

  it('draws the close as the x glyph', () => {
    host.open.set(true);
    fixture.detectChanges();

    const close = document.querySelector('[data-part="close"]') as HTMLElement;
    const glyph = close.querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
    expect(glyph?.getAttribute('data-glyph')).toBe('x');
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes focus in the frame it enters, before the stylesheet reads it as open', () => {
    host.open.set(true);
    fixture.detectChanges();

    expect(layer()?.hasAttribute('data-open')).toBe(false);
    expect(layer()?.hasAttribute('inert')).toBe(false);
  });

  it('writes every axis the stylesheet keys on', () => {
    host.open.set(true);
    host.side.set('bottom');
    host.size.set('lg');
    fixture.detectChanges();

    const root = layer() as HTMLElement;
    expect(root.dataset['mode']).toBe('overlay');
    expect(root.dataset['side']).toBe('bottom');
    expect(root.dataset['size']).toBe('lg');
    expect(root.hasAttribute('data-modal')).toBe(true);
  });

  /* ------------------------------------------------------------- opening - */

  it('opens from the trigger and toggles back', () => {
    press(trigger());
    expect(host.open()).toBe(true);
    expect(host.requests.at(-1)?.reason).toBe('pointer');

    press(trigger());
    expect(host.open()).toBe(false);
  });

  it('promises a popup only where there is one', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');

    host.mode.set('inline');
    fixture.detectChanges();
    expect(trigger().hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('names the panel from the trigger, and the title from the panel', () => {
    host.open.set(true);
    fixture.detectChanges();

    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);
    expect(panel()?.getAttribute('aria-labelledby')).toBe(
      document.querySelector('[data-part="title"]')?.id,
    );
    expect(panel()?.getAttribute('aria-describedby')).toBe(
      document.querySelector('[data-part="description"]')?.id,
    );
  });

  /** A reference to an id nothing carries is worse than no name at all. */
  it('writes no description reference for a part that was not rendered', () => {
    host.open.set(true);
    host.described.set(false);
    fixture.detectChanges();

    expect(panel()?.hasAttribute('aria-describedby')).toBe(false);
  });

  /**
   * An inline panel writes no role (contract `wiring.role`), and a name on a
   * generic element names nothing: the consumer's landmark around it carries
   * the name, as React's inline panel leaves it.
   */
  it('names an inline panel with no role by nothing', () => {
    host.mode.set('inline');
    host.open.set(true);
    fixture.detectChanges();

    expect(panel()?.hasAttribute('role')).toBe(false);
    expect(panel()?.hasAttribute('aria-labelledby')).toBe(false);
  });

  /* -------------------------------------------------------------- closing - */

  it('closes from the close button, carrying dismiss and its value', () => {
    host.open.set(true);
    fixture.detectChanges();

    press(document.querySelector('[data-part="close"]') as HTMLElement);
    expect(host.open()).toBe(false);
    expect(host.requests.at(-1)?.reason).toBe('dismiss');
    expect(host.requests.at(-1)?.result).toBe('dismissed');
  });

  /** What `afterClosed()` is in Angular Material, as an output. */
  it('reports the result once the drawer has actually closed', () => {
    host.open.set(true);
    fixture.detectChanges();

    press(document.querySelector('[data-part="close"]') as HTMLElement);
    expect(host.results.at(-1)).toBe('dismissed');
  });

  it('closes on Escape, and refuses it when the policy says so', () => {
    host.open.set(true);
    fixture.detectChanges();
    escape();
    expect(host.open()).toBe(false);

    host.escape.set('none');
    host.open.set(true);
    fixture.detectChanges();
    escape();
    expect(host.open()).toBe(true);
  });

  /** DR1. The scrim is inside the layer's node; the panel is what a press is inside of. */
  it('closes on a press on the scrim, and not on one that began in the panel', () => {
    host.open.set(true);
    fixture.detectChanges();
    const scrim = document.querySelector('[data-part="backdrop"]') as HTMLElement;
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;

    panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(true);

    scrim.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });

  /**
   * One cancellable request covers every way out. Angular Material's
   * `disableClose` refuses two of the four sources and cannot refuse the third.
   */
  it('lets one guard refuse every source', () => {
    const drawer = fixture.debugElement.children
      .map((child) => child.componentInstance)
      .find((instance): instance is SlDrawer => instance instanceof SlDrawer);

    host.open.set(true);
    fixture.detectChanges();
    fixture.componentRef.instance.requests.length = 0;

    const stop = (request: DrawerChangeRequest) => request.cancel();
    drawer?.openChangeRequest.subscribe(stop);

    escape();
    expect(host.open()).toBe(true);

    press(document.querySelector('[data-part="close"]') as HTMLElement);
    expect(host.open()).toBe(true);
  });

  /* --------------------------------------------------------------- modes - */

  it('is a dialog only where the background is out of reach', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(panel()?.getAttribute('role')).toBe('dialog');
    expect(panel()?.getAttribute('aria-modal')).toBe('true');

    host.mode.set('inline');
    fixture.detectChanges();
    expect(panel()?.hasAttribute('role')).toBe(false);
    expect(panel()?.hasAttribute('aria-modal')).toBe(false);
  });

  it('keeps an inline drawer in the document and makes it inert when closed', () => {
    host.mode.set('inline');
    fixture.detectChanges();

    expect(layer()).not.toBeNull();
    expect(layer()?.hasAttribute('inert')).toBe(true);
    expect(layer()?.hasAttribute('data-open')).toBe(false);
  });

  it('paints no scrim where there is nothing to put out of reach', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(document.querySelector('[data-part="backdrop"]')).not.toBeNull();

    host.mode.set('inline');
    fixture.detectChanges();
    expect(document.querySelector('[data-part="backdrop"]')).toBeNull();
  });

  /* ------------------------------------------------------------- resizing - */

  it('wires the separator to the pane it sizes, both ways', () => {
    host.open.set(true);
    fixture.detectChanges();

    const bar = separator() as HTMLElement;
    expect(bar.getAttribute('role')).toBe('separator');
    expect(bar.getAttribute('tabindex')).toBe('0');
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
    expect(bar.getAttribute('aria-controls')).toBe(panel()?.id);
    expect(bar.getAttribute('aria-labelledby')).toBe(
      document.querySelector('[data-part="title"]')?.id,
    );
  });

  it('reports the measure as the range the pattern calls typical', () => {
    host.open.set(true);
    host.extent.set(0.4);
    fixture.detectChanges();

    const bar = separator() as HTMLElement;
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('20');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('turns the block axis around for a sheet', () => {
    host.open.set(true);
    host.side.set('bottom');
    fixture.detectChanges();
    expect(separator()?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  /**
   * The arrows name a direction on the screen, which is the Window Splitter
   * pattern's own reading: the same key moves the separator the same way, and
   * two panels on opposite edges therefore move in opposite directions.
   */
  it('moves the separator by the screen rather than by the anchor', () => {
    measureAs(1600, 800);
    host.open.set(true);
    host.extent.set(0.4);
    host.side.set('end');
    fixture.detectChanges();

    key(separator() as HTMLElement, 'ArrowLeft');
    expect(host.extent()).toBeCloseTo(0.4 + 16 / 1600, 5);
    expect(host.extents.at(-1)?.reason).toBe('keyboard');

    host.extent.set(0.4);
    host.side.set('start');
    fixture.detectChanges();
    key(separator() as HTMLElement, 'ArrowLeft');
    expect(host.extent()).toBeCloseTo(0.4 - 16 / 1600, 5);
  });

  /**
   * A distance and not a proportion. Sixteen pixels is an adjustment at every
   * layer width; five per cent of a sixteen-hundred-pixel layer is eighty, and
   * a reader placing an edge against the words beside it cannot use eighty.
   */
  it('moves by sixteen pixels, and by sixty-four with Shift', () => {
    measureAs(1600, 800);
    host.open.set(true);
    host.extent.set(0.5);
    host.side.set('end');
    fixture.detectChanges();

    key(separator() as HTMLElement, 'ArrowLeft');
    expect(host.extent()).toBeCloseTo(0.5 + 16 / 1600, 5);

    host.extent.set(0.5);
    fixture.detectChanges();
    key(separator() as HTMLElement, 'ArrowLeft', { shiftKey: true });
    expect(host.extent()).toBeCloseTo(0.5 + 64 / 1600, 5);

    /* A block side measures against the block axis, so the same press is a
       different fraction of a layer that is not square. */
    host.extent.set(0.5);
    host.side.set('bottom');
    fixture.detectChanges();
    key(separator() as HTMLElement, 'ArrowUp');
    expect(host.extent()).toBeCloseTo(0.5 + 16 / 800, 5);
  });

  /**
   * Back to the measure the size step gives it, which is what `undefined`
   * means for this state and what every desktop pane divider answers a double
   * click with.
   */
  it('restores the measure it started from on a double click', () => {
    measureAs(1600, 800);
    /* The measure a double click restores is the one the consumer's binding
       said before anything moved, so it has to be bound before the drawer
       initialises rather than set after it. Angular holds one model where
       React holds a controlled input and an uncontrolled default. */
    fixture = TestBed.createComponent(DrawerHost);
    host = fixture.componentInstance;
    host.extent.set(0.5);
    host.open.set(true);
    fixture.detectChanges();

    key(separator() as HTMLElement, 'End');
    expect(host.extent()).toBe(1);

    (separator() as HTMLElement).dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.extent()).toBe(0.5);
    expect(host.extents.at(-1)?.reason).toBe('pointer');
  });

  it('restores to the size step itself when the consumer named no measure', () => {
    measureAs(1600, 800);
    host.open.set(true);
    fixture.detectChanges();

    key(separator() as HTMLElement, 'End');
    expect(host.extent()).toBe(1);

    (separator() as HTMLElement).dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.extent()).toBeUndefined();
  });

  /**
   * The cursor has to survive the pointer leaving the separator — capture
   * keeps the events coming and the cursor is decided by what is under the
   * pointer — and a drag across the page must not select the text under it.
   */
  it('holds the cursor and suspends selection for the life of a drag', () => {
    measureAs(1000, 800);
    host.open.set(true);
    host.side.set('end');
    fixture.detectChanges();

    (separator() as HTMLElement).dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 600, pointerId: 1 }),
    );
    (separator() as HTMLElement).dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 580, pointerId: 1 }),
    );
    fixture.detectChanges();
    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.documentElement.style.userSelect).toBe('none');

    (separator() as HTMLElement).dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }),
    );
    fixture.detectChanges();
    expect(document.body.style.cursor).toBe('');
    expect(document.documentElement.style.userSelect).toBe('');
  });

  it('takes Home and End to the ends of the range', () => {
    host.open.set(true);
    host.extent.set(0.5);
    fixture.detectChanges();

    key(separator() as HTMLElement, 'End');
    expect(host.extent()).toBe(1);

    key(separator() as HTMLElement, 'Home');
    expect(host.extent()).toBe(0.2);
  });

  it('collapses and restores on Enter without closing', () => {
    host.open.set(true);
    host.extent.set(0.6);
    fixture.detectChanges();

    key(separator() as HTMLElement, 'Enter');
    expect(host.extent()).toBe(0.2);
    expect(host.open()).toBe(true);

    key(separator() as HTMLElement, 'Enter');
    expect(host.extent()).toBe(0.6);
  });

  it('moves between snap points rather than by the step', () => {
    host.open.set(true);
    host.side.set('bottom');
    host.snapPoints.set([0.25, 0.5, 1]);
    host.extent.set(0.25);
    fixture.detectChanges();

    key(separator() as HTMLElement, 'ArrowUp');
    expect(host.extent()).toBe(0.5);
  });

  it('takes its limits from the first and last stop', () => {
    host.open.set(true);
    host.snapPoints.set([0.3, 0.6, 0.9]);
    fixture.detectChanges();

    expect(separator()?.getAttribute('aria-valuemin')).toBe('30');
    expect(separator()?.getAttribute('aria-valuemax')).toBe('90');
  });

  it('follows the pointer while it is down, and says so in the DOM', () => {
    measureAs(1000, 800);
    host.open.set(true);
    host.side.set('end');
    host.extent.set(0.3);
    fixture.detectChanges();

    const bar = separator() as HTMLElement;
    /* The press alone moves nothing: the panel follows the pointer from the
       offset it was grabbed at, so a press that does not move is a tap. */
    bar.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: 700,
        clientY: 0,
        pointerId: 1,
      }),
    );
    fixture.detectChanges();
    expect(host.extents).toHaveLength(0);
    bar.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 650, clientY: 0, pointerId: 1 }),
    );
    fixture.detectChanges();

    expect(layer()?.hasAttribute('data-dragging')).toBe(true);
    expect(host.extent()).toBeCloseTo(0.35, 5);

    bar.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
    fixture.detectChanges();
    expect(layer()?.hasAttribute('data-dragging')).toBe(false);
  });

  /**
   * One rule on release: a measure below the floor asks to close, carrying
   * `pointer`, which is what MUI's `SwipeableDrawer` and Vaul's dismiss gesture
   * both do — expressed as a consequence of the resize rather than as a second
   * mechanism.
   */
  it('asks to close when a drag is released below the floor', () => {
    measureAs(1000, 800);
    host.open.set(true);
    host.side.set('end');
    host.extent.set(0.3);
    fixture.detectChanges();

    const bar = separator() as HTMLElement;
    bar.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: 700,
        clientY: 0,
        pointerId: 1,
      }),
    );
    bar.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 950, clientY: 0, pointerId: 1 }),
    );
    fixture.detectChanges();
    bar.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
    fixture.detectChanges();

    expect(host.open()).toBe(false);
    expect(host.requests.at(-1)?.reason).toBe('pointer');
  });

  /**
   * A close by the hand asked for the floor as well, and the next open started
   * there: a drawer opened at 30% came back at the 20% floor.
   */
  it('asks for no measure when a drag closes it, so it reopens at its own', async () => {
    measureAs(1000, 800);
    host.open.set(true);
    host.side.set('end');
    host.extent.set(0.3);
    fixture.detectChanges();

    const bar = separator() as HTMLElement;
    bar.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: 700,
        clientY: 0,
        pointerId: 1,
      }),
    );
    bar.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 950, clientY: 0, pointerId: 1 }),
    );
    fixture.detectChanges();
    bar.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    /* The separator resized as it moved; the close gives the measure back. */
    expect(host.open()).toBe(false);
    expect(host.extents.at(-1)?.value).toBe(0.3);
    expect(host.extent()).toBe(0.3);
  });

  /* --------------------------------------------------------------- state - */

  /**
   * A click does not focus a button in Safari, and jsdom follows it, so a
   * drawer opened from its trigger has `body` as the element that held focus.
   * Giving focus back to that is giving it back to nowhere.
   */
  it('gives focus back to the trigger when nothing held it on opening', () => {
    (document.activeElement as HTMLElement | null)?.blur();
    press(trigger());
    expect(panel()).not.toBeNull();
    press(document.querySelector('[data-part="close"]') as HTMLElement);
    expect(document.activeElement).toBe(trigger());
  });

  it('carries the loading state to the row that is waiting', () => {
    host.open.set(true);
    host.loading.set(true);
    fixture.detectChanges();

    expect(layer()?.hasAttribute('data-loading')).toBe(true);
    expect(document.querySelector('[data-part="body"]')?.getAttribute('aria-busy')).toBe('true');
  });

  /* --------------------------------------------------------- composition - */

  it('lets an application set the axes once', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DrawerHost],
      providers: [provideDrawerDefaults({ side: 'start', size: 'xl' })],
    });
    const scoped = TestBed.createComponent(DrawerHost);
    scoped.componentInstance.open.set(true);
    scoped.detectChanges();

    expect(layer()?.dataset['side']).toBe('start');
    expect(layer()?.dataset['size']).toBe('xl');
  });

  it('lets an explicit value win over the provider', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DrawerHost],
      providers: [provideDrawerDefaults({ size: 'xl' })],
    });
    const scoped = TestBed.createComponent(DrawerHost);
    scoped.componentInstance.open.set(true);
    scoped.componentInstance.size.set('sm');
    scoped.detectChanges();

    expect(layer()?.dataset['size']).toBe('sm');
  });

  /* ---------------------------------------------------------- the sheet - */

  /**
   * A sheet is moved by the layer's own scroll, which jsdom neither lays out
   * nor scrolls: the layer is 800 pixels tall and the panel's body 400, and a gesture
   * is where the scroll comes to rest, a `scroll` and then a `scrollend` (or
   * 150 ms of quiet where the document has no `scrollend`).
   */
  const sizes = {
    clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
    offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
  };
  afterEach(() => {
    for (const [name, descriptor] of Object.entries(sizes)) {
      if (descriptor !== undefined) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    }
  });

  const openSheet = () => {
    measureAs(400, 800);
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 800,
    });
    /* The panel's content is its body, 400 pixels of it. */
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset['part'] === 'body' ? 400 : 0;
      },
    });
    host.side.set('bottom');
    host.open.set(true);
    fixture.detectChanges();
    return layer() as HTMLElement;
  };

  const settleAt = async (sheet: HTMLElement, top: number) => {
    sheet.scrollTop = top;
    sheet.dispatchEvent(new Event('scroll'));
    sheet.dispatchEvent(new Event('scrollend'));
    await new Promise((resolve) => setTimeout(resolve, 200));
    fixture.detectChanges();
  };

  it('measures its content on a block side and takes a step on an inline one', () => {
    host.side.set('bottom');
    host.open.set(true);
    fixture.detectChanges();
    expect(layer()?.dataset['size']).toBe('content');
    expect(layer()?.dataset['drag']).toBe('panel');

    host.side.set('end');
    fixture.detectChanges();
    expect(layer()?.dataset['size']).toBe('md');
  });

  it('lays its stops out as snap points, the close among them', () => {
    host.size.set('md');
    host.snapPoints.set([0.5, 0.9]);
    const sheet = openSheet();
    const stops = [...sheet.querySelectorAll<HTMLElement>('[data-part="stop"]')];
    expect(stops.map((stop) => stop.style.insetBlockStart)).toEqual(['0px', '400px', '720px']);
  });

  it('closes when its scroll comes to rest out of sight', async () => {
    const sheet = openSheet();
    await settleAt(sheet, 0);
    expect(host.open()).toBe(false);
    expect(host.requests.at(-1)?.reason).toBe('pointer');
  });

  it('asks for nothing when its scroll comes back to rest on its content', async () => {
    const sheet = openSheet();
    /* The content stop: 400 pixels of panel, capped 400 short of the layer. */
    await settleAt(sheet, 400);
    expect(host.open()).toBe(true);
    expect(host.extent()).toBeUndefined();
  });

  it('asks for the stop its scroll comes to rest on', async () => {
    host.size.set('md');
    host.snapPoints.set([0.5, 0.9]);
    const sheet = openSheet();
    await settleAt(sheet, 720);
    expect(host.extent()).toBe(0.9);
    expect(host.extents.at(-1)?.reason).toBe('pointer');
  });

  it('walks its stops on a tap of the grabber', () => {
    host.size.set('md');
    host.snapPoints.set([0.5, 0.9]);
    host.extent.set(0.5);
    openSheet();
    const bar = separator() as HTMLElement;
    bar.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientY: 400, pointerId: 1 }),
    );
    bar.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 400, pointerId: 1 }));
    fixture.detectChanges();
    expect(host.extent()).toBe(0.9);
    expect(host.extents.at(-1)?.reason).toBe('pointer');
  });

  /** From the content stop, `extent` is `undefined`, and the lowest stop is still a move. */
  it('walks from the content stop back to the lowest snap point', () => {
    /* `measureAs` gives every element, the reserve probe included, a width of
       400, so the content stop here is (800 − 400) / 800. */
    host.snapPoints.set([0.3]);
    openSheet();
    Object.defineProperty(document.querySelector('[data-part="body"]'), 'scrollHeight', {
      configurable: true,
      value: 2000,
    });
    const bar = separator() as HTMLElement;
    bar.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientY: 100, pointerId: 1 }),
    );
    bar.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 }));
    fixture.detectChanges();
    expect(host.extent()).toBe(0.3);
    expect(host.extents.at(-1)?.previous).toBeUndefined();
  });

  /** A sheet that spans the layer is the screen, and the layer says so. */
  it('is expanded at the whole layer and not below it', () => {
    host.snapPoints.set([0.5, 1]);
    host.extent.set(1);
    openSheet();
    expect(layer()?.hasAttribute('data-expanded')).toBe(true);
    host.extent.set(0.5);
    fixture.detectChanges();
    expect(layer()?.hasAttribute('data-expanded')).toBe(false);
  });

  it('leaves the page undimmed below scrimFrom', () => {
    host.size.set('md');
    host.extent.set(0.3);
    host.scrimFrom.set(0.5);
    openSheet();
    expect(layer()?.hasAttribute('data-undimmed')).toBe(true);
  });
});

describe('SlDrawer words', () => {
  it('names the close in the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      imports: [DrawerHost],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(DrawerHost);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const close = () => document.querySelector('[data-part="close"]');

    // language: pt-BR
    expect(close()?.getAttribute('aria-label')).toBe('Fechar');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(close()?.getAttribute('aria-label')).toBe('Close');
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [SlButton, SlDrawer, SlDrawerTrigger],
  template: `<button slButton [slDrawerTrigger]="d">View order</button>
    <sl-drawer #d="slDrawer"></sl-drawer>`,
})
class ButtonTrigger {}

/**
 * The trigger's part names the control the family draws for itself. On the
 * library's button the element is the root of that family, which is what
 * React's `DrawerTrigger render={(props) => <Button {...props} />}` renders:
 * the button's own props are spread after the trigger's.
 */
describe('SlDrawerTrigger on the library button', () => {
  it('leaves the button the root of its own family', () => {
    TestBed.configureTestingModule({ imports: [ButtonTrigger] });
    const fixture = TestBed.createComponent(ButtonTrigger);
    fixture.detectChanges();

    const control = fixture.nativeElement.querySelector('[data-ui="button"]') as HTMLElement;
    expect(control.getAttribute('data-part')).toBe('root');
    expect(control.getAttribute('aria-haspopup')).toBe('dialog');
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [SlDrawer, SlDrawerHeader, SlDrawerTitle, SlDrawerBody],
  template: `<sl-drawer mode="inline" side="start" [open]="true" [extent]="0.4">
    <header slDrawerHeader><h2 slDrawerTitle>Filters</h2></header>
    <div slDrawerBody>Status</div>
  </sl-drawer>`,
})
class OpenInline {}

/**
 * The server lays nothing out, and its DOM has no `getBoundingClientRect`: an
 * inline drawer rendered open there threw from the effects that measure it,
 * and the application's error handler logged one error per drawer.
 */
describe('SlDrawer on the server', () => {
  it('measures nothing while it renders an open inline drawer', () => {
    TestBed.configureTestingModule({
      imports: [OpenInline],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    const fixture = TestBed.createComponent(OpenInline);
    fixture.detectChanges();
    TestBed.tick();

    expect(fixture.nativeElement.querySelector('[data-part="panel"]')).not.toBeNull();
    expect(measure).not.toHaveBeenCalled();
    measure.mockRestore();
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [SlDrawer, SlDrawerBody],
  template: `<div class="layout">
    <sl-drawer mode="inline" side="start" [open]="true" [extent]="0.4">
      <div slDrawerBody>Status</div>
    </sl-drawer>
  </div>`,
})
class MeasuredInline {}

/**
 * An inline drawer's measure is a fraction of the box it stands in. The host
 * renders `display: contents` and lays nothing out, so that box is the host's
 * own parent: the consumer's layout.
 */
describe('SlDrawer inline extent', () => {
  it('is a fraction of the consumer’s layout, not of its own host', () => {
    TestBed.configureTestingModule({ imports: [MeasuredInline] });
    const measure = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const width = this.classList.contains('layout') ? 1000 : 0;
        return {
          bottom: 600,
          height: 600,
          left: 0,
          right: width,
          top: 0,
          width,
          x: 0,
          y: 0,
        } as DOMRect;
      });
    const fixture = TestBed.createComponent(MeasuredInline);
    fixture.detectChanges();
    TestBed.tick();

    const root = fixture.nativeElement.querySelector('[data-ui="drawer"]') as HTMLElement;
    expect(root.style.getPropertyValue('--slotted-drawer-extent')).toBe('400px');
    measure.mockRestore();
    fixture.destroy();
  });
});
