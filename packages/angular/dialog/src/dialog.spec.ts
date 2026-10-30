import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/dialog/contract.json';
import { SlAlertDialog, SlDialog } from './dialog';
import { provideDialogDefaults } from './dialog-defaults';
import type { DialogChangeRequest, DialogFullscreenRequest } from './dialog-defaults';
import {
  SlAlertDialogAction,
  SlAlertDialogCancel,
  SlAlertDialogIcon,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from './dialog-parts';

@Component({
  standalone: true,
  imports: [
    SlDialog,
    SlDialogTrigger,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogDescription,
    SlDialogBody,
    SlDialogFooter,
    SlDialogClose,
  ],
  template: `<button [slDialogTrigger]="d">Edit project</button>
    <sl-dialog
      #d="slDialog"
      [(open)]="open"
      [size]="size()"
      [surface]="surface()"
      [modal]="modal()"
      [escape]="escape()"
      [outsidePress]="outsidePress()"
      [back]="back()"
      [mount]="mount()"
      [loading]="loading()"
      [fullscreenToggle]="fullscreenToggle()"
      [(fullscreen)]="fullscreen"
      (openChangeRequest)="requests.push($event)"
      (fullscreenChangeRequest)="onFullscreenRequest($event)"
      (closed)="results.push($event)"
      (openChangeComplete)="settled.push($event)"
    >
      <header slDialogHeader>
        <h2 slDialogTitle>Edit project</h2>
        @if (described()) {
          <p slDialogDescription>Names are visible to everyone.</p>
        }
        <button slDialogClose [value]="'dismissed'"></button>
      </header>
      <div slDialogBody><input aria-label="Name" /></div>
      <footer slDialogFooter><button type="button">Cancel</button></footer>
    </sl-dialog>`,
})
class DialogHost {
  readonly open = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg' | 'xl' | 'full' | undefined>(undefined);
  readonly surface = signal<'panel' | 'plain' | undefined>(undefined);
  readonly modal = signal(true);
  readonly escape = signal<'close' | 'none' | undefined>(undefined);
  readonly outsidePress = signal<'close' | 'none' | undefined>(undefined);
  readonly back = signal<'close' | 'none' | undefined>(undefined);
  readonly mount = signal<'active' | 'lazy' | 'eager' | undefined>(undefined);
  readonly loading = signal(false);
  readonly described = signal(true);
  readonly fullscreenToggle = signal(false);
  readonly fullscreen = signal(false);
  readonly requests: DialogChangeRequest[] = [];
  readonly fullscreenRequests: DialogFullscreenRequest[] = [];
  readonly refuseFullscreen = signal(false);

  onFullscreenRequest(request: DialogFullscreenRequest) {
    this.fullscreenRequests.push(request);
    if (this.refuseFullscreen()) request.cancel();
  }
  readonly results: (string | undefined)[] = [];
  readonly settled: boolean[] = [];
}

@Component({
  standalone: true,
  imports: [
    SlAlertDialog,
    SlDialogTrigger,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogDescription,
    SlDialogBody,
    SlDialogFooter,
    SlAlertDialogIcon,
    SlAlertDialogCancel,
    SlAlertDialogAction,
  ],
  template: `<button [slDialogTrigger]="d">Delete</button>
    <sl-alert-dialog
      #d="slAlertDialog"
      [(open)]="open"
      [tone]="tone()"
      (openChangeRequest)="requests.push($event)"
    >
      <header slDialogHeader>
        <span slAlertDialogIcon></span>
        <h2 slDialogTitle>Delete this project?</h2>
        <p slDialogDescription>This cannot be undone.</p>
      </header>
      <div slDialogBody>The project and its 42 documents are removed for everyone.</div>
      <footer slDialogFooter>
        <button slAlertDialogCancel>Keep project</button>
        <button slAlertDialogAction>Delete project</button>
      </footer>
    </sl-alert-dialog>`,
})
class AlertHost {
  readonly open = signal(false);
  readonly tone = signal<'accent' | 'secondary' | 'success' | 'warning' | 'danger'>('danger');
  readonly requests: DialogChangeRequest[] = [];
}

const layer = () => document.querySelector('[data-ui="dialog"]') as HTMLElement | null;
const panel = () => document.querySelector('[data-part="content"]') as HTMLElement | null;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`) as HTMLElement;

function press(node: Element, detail = 1) {
  node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

function escape() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

/**
 * Each test starts at the end of the session history, as a page just loaded
 * does. A modal layer that closes takes its entry back with `history.back()`
 * (`@slotted/core/dismissable-layer`), which leaves that entry ahead of the
 * current one: the next layer's `pushState` replaces it rather than adding
 * one, and the next test reads a history one entry short. jsdom lands the
 * traversal two tasks after the call, so a test that ends while it is on its
 * way — the current entry still carries a layer's token, and no layer is open
 * — first waits for it, and then a fresh entry drops whatever stands ahead.
 */
beforeEach(async () => {
  const state: unknown = window.history.state;
  if (typeof state === 'object' && state !== null && '__slottedLayer' in state) {
    await new Promise<void>((resolve) => {
      const done = () => {
        window.removeEventListener('popstate', done);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, 100);
      window.addEventListener('popstate', done);
    });
  }
  window.history.pushState(null, '');
});

describe('SlDialog', () => {
  let fixture: ComponentFixture<DialogHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DialogHost] });
    fixture = TestBed.createComponent(DialogHost);
    fixture.detectChanges();
  });

  it('renders the anatomy the contract declares', () => {
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.fullscreenToggle.set(true);
    fixture.detectChanges();

    const parts = [...document.querySelectorAll('[data-part]')].map((node) =>
      node.getAttribute('data-part'),
    );
    for (const declared of contract.members.dialog.parts) {
      expect(parts, `${declared} is declared and never rendered`).toContain(declared);
    }
    expect(layer()?.getAttribute('data-ui')).toBe('dialog');
  });

  /**
   * The host stays where the consumer wrote it and the layer is the element
   * that moves, which is what lets `mount="active"` remove the layer outright
   * and what makes the host the portal's origin.
   */
  /**
   * The reader's own control for taking the layer. `fullScreen` is the other
   * question — the responsive rule the consumer set in advance — and the two
   * are one hyphen apart in the DOM on purpose: `data-full-screen` carries the
   * axis, `data-fullscreen` carries what was pressed.
   */
  describe('the full-screen toggle', () => {
    const toggle = () => part('fullscreen') as HTMLButtonElement | null;

    function open(withToggle = true) {
      fixture.componentInstance.open.set(true);
      fixture.componentInstance.fullscreenToggle.set(withToggle);
      fixture.detectChanges();
    }

    it('is withdrawn until the layer asks for one', () => {
      open(false);
      expect(toggle()).toBeNull();
      expect(contract.members.dialog.defaults.fullscreenToggle).toBe(false);
    });

    it('draws what the press does next: maximize at rest, minimize once pressed', () => {
      open();
      const glyph = () => toggle()?.querySelector('[data-ui="icon"] > svg[data-glyph]');
      expect(glyph()?.getAttribute('data-glyph')).toBe('maximize');

      press(toggle() as Element);
      fixture.detectChanges();
      expect(glyph()?.getAttribute('data-glyph')).toBe('minimize');
    });

    it('draws the close as the x glyph', () => {
      open(false);
      const glyph = part('close').querySelector('[data-ui="icon"] > svg[data-glyph]');
      expect(glyph?.getAttribute('data-glyph')).toBe('x');
      expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    });

    it('takes the layer on a press and gives it back on the next one', () => {
      open();
      expect(toggle()?.getAttribute('aria-pressed')).toBe('false');
      expect(layer()?.hasAttribute('data-fullscreen')).toBe(false);

      press(toggle() as Element);
      fixture.detectChanges();
      expect(layer()?.getAttribute('data-fullscreen')).toBe('');
      expect(toggle()?.getAttribute('aria-pressed')).toBe('true');
      /* The axis is untouched: the reader pressed a control, not an input. */
      expect(layer()?.getAttribute('data-full-screen')).toBe('narrow');

      press(toggle() as Element);
      fixture.detectChanges();
      expect(layer()?.hasAttribute('data-fullscreen')).toBe(false);
    });

    it('stands in the corner beside the close, and not in place of it', () => {
      open();
      const corner = [...part('header').children].map((node) => node.getAttribute('data-part'));
      expect(corner).toContain('close');
      expect(corner).toContain('fullscreen');
      expect(toggle()?.tagName).toBe('BUTTON');
      expect(toggle()?.getAttribute('aria-label')).toBe('Full screen');
    });

    it('carries the reason, and the keyboard says so', () => {
      open();
      press(toggle() as Element, 0);
      fixture.detectChanges();

      expect(fixture.componentInstance.fullscreenRequests.at(-1)).toMatchObject({
        previous: false,
        reason: 'keyboard',
        value: true,
      });
    });

    it('is refused by cancelling the request', () => {
      open();
      fixture.componentInstance.refuseFullscreen.set(true);

      press(toggle() as Element);
      fixture.detectChanges();
      expect(layer()?.hasAttribute('data-fullscreen')).toBe(false);
      expect(fixture.componentInstance.fullscreenRequests).toHaveLength(1);
    });
  });

  it('leaves the layer out of the document entirely while it is closed', () => {
    expect(layer()).toBeNull();
    expect(document.querySelector('sl-dialog')).not.toBeNull();
  });

  it('keeps the layer in the document and inert when it is mounted eagerly', () => {
    fixture.componentInstance.mount.set('eager');
    fixture.detectChanges();

    expect(layer()).not.toBeNull();
    expect(layer()?.hasAttribute('data-open')).toBe(false);
    expect(layer()?.hasAttribute('inert')).toBe(true);
  });

  it('takes focus in the frame it enters, before the stylesheet reads it as open', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(layer()?.hasAttribute('data-open')).toBe(false);
    expect(layer()?.hasAttribute('inert')).toBe(false);
  });

  it('moves the layer into the portal rather than leaving it where it was written', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(layer()?.closest('sl-dialog')).toBeNull();
    expect(layer()?.closest('[data-slotted-portal]')).not.toBeNull();
  });

  it('opens from the trigger and says whether a pointer or a key did it', () => {
    press(document.querySelector('[data-part="trigger"]') as Element);
    fixture.detectChanges();

    expect(fixture.componentInstance.requests[0]?.reason).toBe('pointer');
    expect(fixture.componentInstance.open()).toBe(true);
    expect(panel()).not.toBeNull();
  });

  it('reports a keyboard activation as keyboard rather than as a pointer', () => {
    press(document.querySelector('[data-part="trigger"]') as Element, 0);
    fixture.detectChanges();

    expect(fixture.componentInstance.requests[0]?.reason).toBe('keyboard');
  });

  it('wires the trigger to the layer it opens', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(panel()?.id);
  });

  it('names the layer by its title and describes it by its description', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const content = panel() as HTMLElement;
    expect(content.getAttribute('role')).toBe('dialog');
    expect(content.getAttribute('aria-modal')).toBe('true');
    expect(
      document.getElementById(content.getAttribute('aria-labelledby') ?? '')?.textContent,
    ).toContain('Edit project');
    expect(
      document.getElementById(content.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toContain('Names are visible');
  });

  /** An `aria-labelledby` pointing at an id nothing carries is worse than none. */
  it('writes no aria-describedby when no description part was rendered', () => {
    fixture.componentInstance.described.set(false);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(panel()?.hasAttribute('aria-describedby')).toBe(false);
  });

  /**
   * The APG warns that marking a dialog modal without making the background
   * inert has severe consequences for the readers who rely on the mark.
   */
  it('writes no aria-modal on a layer that leaves the background reachable', () => {
    fixture.componentInstance.modal.set(false);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(panel()?.hasAttribute('aria-modal')).toBe(false);
    expect(layer()?.hasAttribute('data-modal')).toBe(false);
  });

  it('closes on Escape, carrying escape', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    escape();
    fixture.detectChanges();

    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('escape');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  /**
   * The platform's way back reaches the layer and not the page: a modal layer
   * holds one history entry, and the popstate that leaves it closes the layer
   * with the reason back. A layer told not to answer holds no entry.
   */
  it('closes on the platform way back, carrying back', async () => {
    const popped = () =>
      new Promise<void>((resolve) =>
        window.addEventListener('popstate', () => resolve(), { once: true }),
      );
    const length = history.length;
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(history.length).toBe(length + 1);

    const gesture = popped();
    history.back();
    await gesture;
    fixture.detectChanges();

    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('back');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('holds no history entry when the consumer says back does not close it', () => {
    fixture.componentInstance.back.set('none');
    const length = history.length;
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(history.length).toBe(length);
  });

  it('refuses Escape when the consumer says the layer does not answer it', () => {
    fixture.componentInstance.escape.set('none');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    escape();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('closes on a press outside the layer, carrying outsidePress', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('outsidePress');
  });

  /**
   * DG1. The scrim is inside the layer's node and was never a way out. It is
   * the click that decides, so a selection dragged out of the panel and let go
   * over the scrim closes nothing.
   */
  it('closes on a press on the scrim, and not on one that began in the panel', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    fixture.componentInstance.requests.length = 0;
    const scrim = document.querySelector('[data-part="backdrop"]') as HTMLElement;
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;

    panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(0);

    scrim.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('outsidePress');
    expect(fixture.componentInstance.open()).toBe(false);
  });

  /** The trigger is a branch of the layer, or opening would close it again. */
  it('does not read a press on its own trigger as a press outside', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    fixture.componentInstance.requests.length = 0;

    (document.querySelector('[data-part="trigger"]') as HTMLElement).dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('refuses an outside press when the consumer says so', () => {
    fixture.componentInstance.outsidePress.set('none');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const scrim = document.querySelector('[data-part="backdrop"]') as HTMLElement;

    scrim.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('lets the consumer refuse a close while a form is saving', () => {
    TestBed.resetTestingModule();

    @Component({
      standalone: true,
      imports: [SlDialog, SlDialogHeader, SlDialogTitle],
      template: `<sl-dialog [(open)]="open" (openChangeRequest)="refuse($event)">
        <header slDialogHeader><h2 slDialogTitle>Saving</h2></header>
      </sl-dialog>`,
    })
    class Refusing {
      readonly open = signal(true);
      refuse(request: DialogChangeRequest) {
        if (!request.value) request.cancel();
      }
    }

    const refusing = TestBed.createComponent(Refusing);
    refusing.detectChanges();

    escape();
    refusing.detectChanges();

    expect(refusing.componentInstance.open()).toBe(true);
  });

  it('closes from the close button carrying dismiss and the result it names', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    press(part('close'));
    fixture.detectChanges();

    const request = fixture.componentInstance.requests.at(-1);
    expect(request?.reason).toBe('dismiss');
    expect(request?.result).toBe('dismissed');
  });

  /**
   * An application that removes the dialog on close waits for the exit to
   * end; `openChangeComplete` says when the entrance and the exit have ended.
   */
  it('reports when the layer is settled open and when it has left', async () => {
    const frames = () => new Promise((resolve) => setTimeout(resolve, 60));
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await frames();
    fixture.detectChanges();
    expect(fixture.componentInstance.settled).toEqual([true]);

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await frames();
    fixture.detectChanges();
    expect(fixture.componentInstance.settled).toEqual([true, false]);
  });

  /** `afterClosed()` in Angular Material, as an output. */
  it('reports the result once the layer has actually closed', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    press(part('close'));
    fixture.detectChanges();

    expect(fixture.componentInstance.results).toContain('dismissed');
  });

  it('moves focus into the layer and gives it back to the trigger', () => {
    const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
    trigger.focus();

    press(trigger);
    fixture.detectChanges();
    expect(panel()?.contains(document.activeElement)).toBe(true);

    escape();
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger);
  });

  /**
   * A browser refuses focus on an element inside an `inert` subtree, and the
   * background of a modal layer is inert until the layer is taken down. jsdom
   * does not refuse it, so the test records where the background stood at the
   * moment focus was handed back.
   */
  it('gives focus back to the trigger once the background is no longer inert', () => {
    const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
    trigger.focus();
    press(trigger);
    fixture.detectChanges();
    expect(trigger.closest('[inert]')).not.toBeNull();

    let inertWhenFocused: boolean | undefined;
    const focus = vi.spyOn(trigger, 'focus').mockImplementation(function (this: HTMLElement) {
      inertWhenFocused = this.closest('[inert]') !== null;
      HTMLElement.prototype.focus.call(this);
    });

    escape();
    fixture.detectChanges();
    expect(focus).toHaveBeenCalled();
    expect(inertWhenFocused).toBe(false);
  });

  it('marks the row that is still loading as busy without locking the way out', () => {
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(part('body').getAttribute('aria-busy')).toBe('true');
    expect(layer()?.hasAttribute('data-loading')).toBe(true);
    expect((part('close') as HTMLButtonElement).disabled).toBe(false);
  });

  /**
   * The layer without the picture: the portal, the scrim, the containment and
   * the dismissal policy all stay, and the family paints nothing.
   */
  it('turns the family’s own paint off and keeps everything that is not paint', () => {
    fixture.componentInstance.surface.set('plain');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(layer()?.getAttribute('data-surface')).toBe('plain');
    expect(document.querySelector('[data-part="backdrop"]')).not.toBeNull();
    expect(panel()?.getAttribute('aria-modal')).toBe('true');
    expect(panel()?.contains(document.activeElement)).toBe(true);
  });

  it('takes an explicit size over the one the application set', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DialogHost],
      providers: [provideDialogDefaults({ size: 'xl', placement: 'top' })],
    });
    const provided = TestBed.createComponent(DialogHost);
    provided.componentInstance.open.set(true);
    provided.detectChanges();

    expect(layer()?.getAttribute('data-size')).toBe('xl');
    expect(layer()?.getAttribute('data-placement')).toBe('top');

    provided.componentInstance.size.set('sm');
    provided.detectChanges();
    expect(layer()?.getAttribute('data-size')).toBe('sm');
  });

  it('opens and closes from the instance a template reference variable reaches', () => {
    const dialog = fixture.debugElement.query((node) => node.name === 'sl-dialog')
      .componentInstance as SlDialog;

    dialog.openDialog();
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('programmatic');

    dialog.close('saved');
    fixture.detectChanges();
    expect(fixture.componentInstance.results).toContain('saved');
  });
});

describe('SlAlertDialog', () => {
  let fixture: ComponentFixture<AlertHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AlertHost] });
    fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
  });

  it('renders the anatomy the contract declares for its member', () => {
    const parts = [...document.querySelectorAll('[data-part]')].map((node) =>
      node.getAttribute('data-part'),
    );
    for (const declared of contract.members.alertDialog.parts) {
      expect(parts, `${declared} is declared and never rendered`).toContain(declared);
    }
  });

  it('takes the role the pattern gives it and a tone of its own', () => {
    expect(panel()?.getAttribute('role')).toBe('alertdialog');
    expect(layer()?.getAttribute('data-tone')).toBe('danger');
  });

  it('draws each tone’s own glyph as the mark', () => {
    const glyphs = {
      accent: 'status-info',
      secondary: 'status-info',
      success: 'status-success',
      warning: 'status-warning',
      danger: 'status-danger',
    } as const;
    for (const [tone, glyph] of Object.entries(glyphs)) {
      fixture.componentInstance.tone.set(tone as keyof typeof glyphs);
      fixture.detectChanges();
      const drawn = part('icon').querySelector('[data-ui="icon"] > svg[data-part="glyph"]');
      expect(drawn?.getAttribute('data-glyph'), tone).toBe(glyph);
    }
  });

  /**
   * Ark and React Aria make the role a prop, so a consumer who sets it and
   * forgets the dismissal policy ships a destructive confirmation a stray click
   * dismisses. Here the member fixes it.
   */
  it('never closes on an outside press, whatever the consumer asks for', () => {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('is modal whatever the consumer asks for', () => {
    expect(panel()?.getAttribute('aria-modal')).toBe('true');
  });

  /** The APG's own advice for a step that is not easily reversible. */
  it('focuses the least destructive action rather than the first tabbable one', () => {
    expect(document.activeElement).toBe(part('cancel'));
  });

  it('closes from the action with submit and from cancel with dismiss', () => {
    press(part('action'));
    fixture.detectChanges();
    const confirmed = fixture.componentInstance.requests.at(-1);
    expect(confirmed?.reason).toBe('submit');
    expect(confirmed?.result).toBe('confirm');

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    press(part('cancel'));
    fixture.detectChanges();
    const cancelled = fixture.componentInstance.requests.at(-1);
    expect(cancelled?.reason).toBe('dismiss');
    expect(cancelled?.result).toBe('cancel');
  });

  it('answers Escape, because a member with a cancel action can always cancel', () => {
    escape();
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)?.reason).toBe('escape');
  });

  it('refuses a close button, which is two controls for one outcome', () => {
    TestBed.resetTestingModule();

    @Component({
      standalone: true,
      imports: [SlAlertDialog, SlDialogHeader, SlDialogTitle, SlDialogDescription, SlDialogClose],
      template: `<sl-alert-dialog [open]="true">
        <header slDialogHeader>
          <h2 slDialogTitle>Delete?</h2>
          <p slDialogDescription>Gone for good.</p>
          <button slDialogClose></button>
        </header>
      </sl-alert-dialog>`,
    })
    class WithClose {}

    expect(() => TestBed.createComponent(WithClose).detectChanges()).toThrow(/no close part/i);
  });

  /** The alertdialog pattern makes `aria-describedby` mandatory. */
  it('refuses to ship without the description the pattern requires', () => {
    TestBed.resetTestingModule();

    @Component({
      standalone: true,
      imports: [SlAlertDialog, SlDialogHeader, SlDialogTitle],
      template: `<sl-alert-dialog [open]="true">
        <header slDialogHeader><h2 slDialogTitle>Delete?</h2></header>
      </sl-alert-dialog>`,
    })
    class WithoutDescription {}

    expect(() => TestBed.createComponent(WithoutDescription).detectChanges()).toThrow(
      /slDialogDescription|aria-describedby/i,
    );
  });
});

describe('SlDialog words', () => {
  it('names the corner controls in the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      imports: [DialogHost],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = TestBed.createComponent(DialogHost);
    fixture.componentInstance.fullscreenToggle.set(true);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    // language: pt-BR
    expect(part('fullscreen').getAttribute('aria-label')).toBe('Tela cheia');
    expect(part('close').getAttribute('aria-label')).toBe('Fechar');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(part('fullscreen').getAttribute('aria-label')).toBe('Full screen');
    expect(part('close').getAttribute('aria-label')).toBe('Close');
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [SlButton, SlDialog, SlDialogTrigger],
  template: `<button slButton [slDialogTrigger]="d">Edit project</button>
    <sl-dialog #d="slDialog"></sl-dialog>`,
})
class ButtonTrigger {}

/**
 * The trigger's part names the control the family draws for itself. On the
 * library's button the element is the root of that family, which is what
 * React's `DialogTrigger render={(props) => <Button {...props} />}` renders:
 * the button's own props are spread after the trigger's.
 */
describe('SlDialogTrigger on the library button', () => {
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
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlButton,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
  ],
  template: `<sl-alert-dialog [open]="true">
    <header slDialogHeader>
      <h2 slDialogTitle>Delete this project?</h2>
      <p slDialogDescription>This cannot be undone.</p>
    </header>
    <footer slDialogFooter>
      <button slButton slAlertDialogCancel>Keep project</button>
      <button slButton slAlertDialogAction>Delete project</button>
    </footer>
  </sl-alert-dialog>`,
})
class ButtonAnswers {}

/**
 * React's `AlertDialogCancel render={(props) => <Button {...props} />}` spreads
 * the button's own props after the part's, so the element stays the root of
 * the button family. The directive on `slButton` keeps the same rule the
 * trigger keeps.
 */
describe('SlAlertDialogCancel and SlAlertDialogAction on the library button', () => {
  it('leave each button the root of its own family', () => {
    TestBed.configureTestingModule({ imports: [ButtonAnswers] });
    const fixture = TestBed.createComponent(ButtonAnswers);
    fixture.detectChanges();

    const buttons = [...document.querySelectorAll<HTMLElement>('[data-ui="button"]')];
    expect(buttons.map((button) => button.getAttribute('data-part'))).toEqual(['root', 'root']);
    expect(document.activeElement).toBe(buttons[0]);
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [
    SlAlertDialog,
    SlAlertDialogAction,
    SlAlertDialogCancel,
    SlDialog,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
  ],
  template: `<button [slDialogTrigger]="outer">Change address</button>
    <sl-dialog #outer="slDialog" [(open)]="open" (closed)="closed.push('outer')">
      <header slDialogHeader><h2 slDialogTitle>Delivery address</h2></header>
      <footer slDialogFooter>
        <button type="button" (click)="confirming.set(true)">Cancel</button>
      </footer>
      <sl-alert-dialog [(open)]="confirming" (closed)="closed.push('inner')">
        <header slDialogHeader>
          <h2 slDialogTitle>Discard the new address?</h2>
          <p slDialogDescription>The order keeps the previous one.</p>
        </header>
        <footer slDialogFooter>
          <button slAlertDialogCancel>Keep editing</button>
          <button slAlertDialogAction (click)="open.set(false)">Discard changes</button>
        </footer>
      </sl-alert-dialog>
    </sl-dialog>`,
})
class StackedHost {
  readonly open = signal(false);
  readonly confirming = signal(false);
  readonly closed: string[] = [];
}

/**
 * An action in a confirmation that closes the dialog under it closes both in
 * one change. The layers come down from the top, as React's effects do: the
 * confirmation gives focus back to the dialog's control that opened it, and
 * the dialog then gives it back to its own trigger. Taken down from the
 * bottom, the dialog found focus in the confirmation and restored nothing,
 * and the confirmation handed it to a control in a layer already leaving —
 * `body` once that layer was gone.
 */
describe('stacked layers that close in one change', () => {
  it('come down from the top, and focus returns to the trigger of the outermost', () => {
    TestBed.configureTestingModule({ imports: [StackedHost] });
    const fixture = TestBed.createComponent(StackedHost);
    fixture.detectChanges();

    const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
    trigger.focus();
    press(trigger);
    fixture.detectChanges();
    const cancel = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Cancel',
    ) as HTMLElement;
    cancel.focus();
    press(cancel);
    fixture.detectChanges();
    expect(document.activeElement?.textContent?.trim()).toBe('Keep editing');

    press(part('action'));
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger);
    expect(fixture.componentInstance.closed).toEqual(['inner', 'outer']);
    expect(trigger.closest('[inert]')).toBeNull();
    fixture.destroy();
  });
});

@Component({
  standalone: true,
  imports: [SlDialog],
  template: `<sl-dialog [open]="true" [fullScreen]="fullScreen()" aria-label="Search"></sl-dialog>`,
})
class KeyboardHost {
  readonly fullScreen = signal<'narrow' | 'never'>('narrow');
}

/**
 * The virtual keyboard covers the band of the layout viewport below the
 * visual one. A layer whose panel can cover it carries that band as
 * `--slotted-keyboard-inset`, and a centerd panel reads nothing from it.
 */
describe('SlDialog over the virtual keyboard', () => {
  const keyboard = (covered: number) => {
    const viewport = Object.assign(new EventTarget(), {
      height: window.innerHeight - covered,
      offsetTop: 0,
    });
    vi.stubGlobal('visualViewport', viewport);
    return viewport;
  };
  const inset = () => layer()?.style.getPropertyValue('--slotted-keyboard-inset') ?? '';
  const mount = (fullScreen: 'narrow' | 'never') => {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(KeyboardHost);
    fixture.componentInstance.fullScreen.set(fullScreen);
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes what the keys cover on a full-screen layer, and follows them', () => {
    const viewport = keyboard(260);
    const fixture = mount('narrow');
    expect(inset()).toBe('260px');

    viewport.height = window.innerHeight;
    viewport.dispatchEvent(new Event('resize'));
    expect(inset()).toBe('');
    fixture.destroy();
  });

  it('leaves a centerd layer alone', () => {
    keyboard(260);
    const fixture = mount('never');
    expect(inset()).toBe('');
    fixture.destroy();
  });
});
