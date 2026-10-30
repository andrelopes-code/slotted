import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { SlButton } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SlMenu } from './menu';
import {
  SlMenuGroup,
  SlMenuHeader,
  SlMenuItem,
  SlMenuItemDescription,
  SlMenuItemIcon,
  SlMenuItemMeta,
  SlMenuRadioGroup,
  SlMenuSeparator,
} from './menu-items';
import { SlMenuTrigger } from './menu-trigger';
import { provideMenuDefaults } from './menu-defaults';

@Component({
  standalone: true,
  imports: [
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuItemDescription,
    SlMenuItemIcon,
    SlMenuRadioGroup,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button [slMenuTriggerFor]="document">Document</button>
    <sl-menu #document aria-describedby="document-help" [size]="size()">
      <sl-menu-group label="File">
        <button slMenuItem shortcut="Mod+D" (select)="ran.set($event.reason)">
          <span slMenuItemIcon
            ><span slIcon><svg slGlyph name="copy"></svg></span
          ></span>
          Duplicate
        </button>
        <button slMenuItem [disabled]="true" (select)="ran.set($event.reason)">Publish</button>
      </sl-menu-group>
      <hr slMenuSeparator />
      <button slMenuCheckboxItem [(checked)]="comments">Show comments</button>
      <sl-menu-radio-group [(value)]="sort">
        <button slMenuRadioItem value="name">Name</button>
        <button slMenuRadioItem value="date">Date</button>
      </sl-menu-radio-group>
      <button slMenuItem [slMenuTriggerFor]="exports">Export as</button>
      <sl-menu #exports>
        <button slMenuItem>PDF</button>
      </sl-menu>
      <button slMenuItem tone="danger">
        Share
        <span slMenuItemDescription>Anyone with the link.</span>
      </button>
    </sl-menu>
    <button type="button">After</button>
  `,
})
class Host {
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly comments = signal(false);
  readonly sort = signal<string | undefined>('name');
  readonly ran = signal<string | undefined>(undefined);
}

const surface = () => document.querySelector<HTMLElement>("[data-ui='menu'] [data-part='content']");
const items = () => [...document.querySelectorAll<HTMLElement>("[data-part='item']")];
const item = (label: string) =>
  items().find((node) => node.querySelector("[data-part='label']")?.textContent?.trim() === label);

const press = (key: string, options: KeyboardEventInit = {}) =>
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key, ...options }),
  );

const click = (node: Element | null | undefined, detail = 1) =>
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));

describe('SlMenu', () => {
  let fixture: ComponentFixture<Host>;
  let trigger: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    trigger = fixture.nativeElement.querySelector('button') as HTMLElement;
  });

  const open = async () => {
    click(trigger);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  /* The first column holds the consumer's element, and the stylesheet paints nothing there. */
  it('puts the icon it is given in the first column', async () => {
    await open();

    expect(
      item('Duplicate')?.querySelector(
        '[data-part="icon"] > [data-ui="icon"] > svg[data-glyph="copy"]',
      ),
    ).not.toBeNull();
  });

  it('wires the control to the surface it discloses', async () => {
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await open();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(surface()?.id);
    expect(surface()?.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(surface()?.getAttribute('role')).toBe('menu');
    expect(surface()?.getAttribute('aria-describedby')).toBe('document-help');
  });

  it('opens onto the first item, as the pattern requires', async () => {
    await open();
    expect(document.activeElement).toBe(item('Duplicate'));
  });

  it('opens onto the last item when the control is arrowed up', async () => {
    trigger.focus();
    press('ArrowUp');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(items().at(-1));
  });

  it('moves along the items and reaches both ends', async () => {
    await open();

    press('ArrowDown');
    expect(document.activeElement).toBe(item('Publish'));

    press('End');
    expect(document.activeElement).toBe(items().at(-1));

    press('Home');
    expect(document.activeElement).toBe(item('Duplicate'));
  });

  it('keeps a disabled item in the ring and runs nothing from it', async () => {
    await open();

    press('ArrowDown');
    const publish = item('Publish');
    expect(document.activeElement).toBe(publish);
    expect(publish?.getAttribute('aria-disabled')).toBe('true');

    click(publish);
    fixture.detectChanges();

    expect(fixture.componentInstance.ran()).toBeUndefined();
    expect(surface()).not.toBeNull();
  });

  it('moves to the item a printable character names', async () => {
    await open();

    press('s');
    expect(document.activeElement).toBe(item('Show comments'));
  });

  it('runs an item, reports the device, and closes', async () => {
    await open();

    click(item('Duplicate'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.ran()).toBe('pointer');
    expect(surface()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('prints a shortcut for the platform and announces it', async () => {
    await open();

    const duplicate = item('Duplicate');
    expect(duplicate?.getAttribute('aria-keyshortcuts')).toBe('Control+D');
    expect(duplicate?.querySelector("[data-part='shortcut']")?.textContent).toBe('Ctrl+D');
    expect(duplicate?.querySelector("[data-part='shortcut']")?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('holds a checkbox item without closing the menu', async () => {
    await open();

    const checkbox = item('Show comments');
    expect(checkbox?.getAttribute('role')).toBe('menuitemcheckbox');
    expect(checkbox?.getAttribute('aria-checked')).toBe('false');
    expect(
      checkbox?.querySelector(
        '[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph="check"]',
      ),
    ).not.toBeNull();
    expect(
      item('Name')?.querySelector(
        '[data-part="indicator"] > [data-ui="icon"] > svg[data-glyph="dot"]',
      ),
    ).not.toBeNull();
    /* An item that opens nothing ends in no chevron. */
    expect(checkbox?.lastElementChild?.getAttribute('data-ui')).not.toBe('icon');

    click(checkbox);
    fixture.detectChanges();

    expect(fixture.componentInstance.comments()).toBe(true);
    expect(surface()).not.toBeNull();
  });

  it('toggles a checkbox item with Space, which the pattern makes optional', async () => {
    await open();
    item('Show comments')?.focus();

    press(' ');
    fixture.detectChanges();

    expect(fixture.componentInstance.comments()).toBe(true);
    expect(surface()).not.toBeNull();
  });

  it('holds one value across a radio group', async () => {
    await open();

    expect(item('Name')?.getAttribute('aria-checked')).toBe('true');

    click(item('Date'));
    fixture.detectChanges();

    expect(fixture.componentInstance.sort()).toBe('date');
    expect(item('Date')?.getAttribute('aria-checked')).toBe('true');
  });

  it('describes an item from the line under its label', async () => {
    await open();

    const share = item('Share');
    const description = share?.querySelector("[data-part='description']");
    expect(share?.getAttribute('aria-describedby')).toBe(description?.id);
    expect(share?.getAttribute('data-tone')).toBe('danger');
  });

  it('names an item by its label alone when a line describes it', async () => {
    await open();

    const share = item('Share');
    const label = share?.querySelector(":scope > [data-part='label']");
    expect(share?.getAttribute('aria-labelledby')).toBe(label?.id);
    expect(label?.id).toBeTruthy();
    expect(item('Duplicate')?.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('names a group by the label inside it', async () => {
    await open();

    const group = document.querySelector<HTMLElement>("[data-part='group'][role='group']");
    const label = group?.querySelector("[data-part='group-label']");
    expect(group?.getAttribute('aria-labelledby')).toBe(label?.id);
  });

  it('closes on Escape and gives focus back to the control', async () => {
    await open();

    press('Escape');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(surface()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  /**
   * The escape hatch the contract promises under `focus.finalFocus`, written
   * as a signal a trigger directive sets: a context menu's target never held
   * focus, and names what did.
   */
  it('gives focus to finalFocus instead of the control when one is set', async () => {
    const after = fixture.nativeElement.querySelector('button[type="button"]') as HTMLElement;
    const menu = fixture.debugElement.query((node) => node.name === 'sl-menu')
      .componentInstance as SlMenu;
    menu.finalFocus.set(after);
    await open();

    press('Escape');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(surface()).toBeNull();
    expect(document.activeElement).toBe(after);
  });

  /** An anchor that is not the control positions the layer and changes nothing else. */
  it('positions against a given anchor and still returns focus to the control', async () => {
    const menu = fixture.debugElement.query((node) => node.name === 'sl-menu')
      .componentInstance as SlMenu;
    menu.anchor.set({ getBoundingClientRect: () => new DOMRect(40, 60, 0, 0) });
    await open();
    expect(document.activeElement).toBe(item('Duplicate'));

    press('Escape');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Tab and moves focus past the control', async () => {
    await open();

    press('Tab');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(surface()).toBeNull();
    expect((document.activeElement as HTMLElement).textContent).toBe('After');
  });

  it('opens a submenu on the inline end and closes it back onto its item', async () => {
    await open();

    const parentItem = item('Export as');
    expect(parentItem?.getAttribute('aria-haspopup')).toBe('menu');
    const chevron = parentItem?.lastElementChild;
    expect(chevron?.getAttribute('data-ui')).toBe('icon');
    expect(chevron?.hasAttribute('data-directional')).toBe(true);
    expect(chevron?.querySelector('svg[data-glyph="chevron-right"]')).not.toBeNull();

    parentItem?.focus();
    press('ArrowRight');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(item('PDF')).not.toBeUndefined();
    expect(document.activeElement).toBe(item('PDF'));

    press('ArrowLeft');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(item('PDF')).toBeUndefined();
    expect(document.activeElement).toBe(item('Export as'));
  });

  /**
   * Where a submenu lands (M2). A headless document lays nothing out, so the
   * surfaces are given the boxes a browser would give them: the parent surface
   * insets its items by five pixels (a border and a step of padding), and the
   * submenu surface insets its first item by the same five. The positioner is
   * real; only the measurements are stated.
   */
  it('lands one inset out from the parent edge, its first item level with the item that opened it', async () => {
    const boxOf = (element: Element) => {
      const text = element.textContent ?? '';
      const role = element.getAttribute('role');
      const part = element.getAttribute('data-part');
      if (role === 'menu' && text.includes('Export as')) {
        return { x: 100, y: 100, width: 200, height: 120 };
      }
      if (role === 'menuitem' && text.trim() === 'Export as') {
        return { x: 105, y: 140, width: 190, height: 32 };
      }
      if (element.getAttribute('data-ui') === 'menu' && part === 'root' && text.includes('PDF')) {
        return { x: 0, y: 0, width: 168, height: 90 };
      }
      if (role === 'menu' && text.includes('PDF')) return { x: 0, y: 0, width: 160, height: 90 };
      if (role === 'menuitem' && text.trim() === 'PDF')
        return { x: 5, y: 5, width: 150, height: 32 };
      return { x: 0, y: 0, width: 0, height: 0 };
    };
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const box = boxOf(this);
      return {
        ...box,
        left: box.x,
        top: box.y,
        right: box.x + box.width,
        bottom: box.y + box.height,
        toJSON: () => ({}),
      };
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return boxOf(this).width;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return boxOf(this).height;
    });

    await open();
    item('Export as')?.focus();
    press('ArrowRight');
    fixture.detectChanges();
    await fixture.whenStable();

    const layer = item('PDF')?.closest<HTMLElement>("[data-ui='menu']") ?? null;
    expect(layer).not.toBeNull();
    await vi.waitFor(() => expect(layer?.hasAttribute('data-positioned')).toBe(true));
    /* The item's right edge is at 295; the parent surface's inset of 5 puts
       the layer at 300, and the submenu's inset of 5 lifts it from 140 to 135. */
    expect(layer?.style.left).toBe('300px');
    expect(layer?.style.top).toBe('135px');
    vi.restoreAllMocks();
  });

  it('waits a hundred and fifty milliseconds before hover opens a submenu', async () => {
    await open();
    vi.useFakeTimers();
    try {
      item('Export as')?.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      await vi.advanceTimersByTimeAsync(100);
      fixture.detectChanges();
      expect(item('PDF')).toBeUndefined();

      await vi.advanceTimersByTimeAsync(50);
      fixture.detectChanges();
      expect(item('PDF')).not.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('takes the size an application set once', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideMenuDefaults({ size: 'lg' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.detectChanges();
    await scoped.whenStable();

    (scoped.nativeElement.querySelector('button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    scoped.detectChanges();
    await scoped.whenStable();

    expect(document.querySelector("[data-ui='menu']")?.getAttribute('data-size')).toBe('lg');
  });

  it('stands at its content width, or at the anchor width an application set once', async () => {
    (fixture.nativeElement.querySelector('button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector("[data-ui='menu']")?.getAttribute('data-width')).toBe('content');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideMenuDefaults({ width: 'anchor' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.detectChanges();
    await scoped.whenStable();

    (scoped.nativeElement.querySelector('button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    scoped.detectChanges();
    await scoped.whenStable();

    expect(document.querySelector("[data-ui='menu']")?.getAttribute('data-width')).toBe('anchor');
  });
});

@Component({
  standalone: true,
  imports: [SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <button [slMenuTriggerFor]="share">Share</button>
    <sl-menu #share>
      <button slMenuItem>Copy link</button>
      <button slMenuItem [slMenuTriggerFor]="sendTo">Send to</button>
      <sl-menu #sendTo>
        <button slMenuItem>Slack</button>
        <button slMenuItem [slMenuTriggerFor]="more">More</button>
        <sl-menu #more>
          <button slMenuItem>Teams</button>
          <button slMenuItem>Matrix</button>
        </sl-menu>
      </sl-menu>
    </sl-menu>
  `,
})
class ThreeLevels {}

/**
 * A submenu is this family opened from an item, so the third level holds every
 * rule the second does: the keyboard reaches it, Escape closes only it, and
 * the inline-start arrow hands focus back to the item that opened it.
 */
describe('SlMenu three levels deep', () => {
  let fixture: ComponentFixture<ThreeLevels>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const surfaces = () => document.querySelectorAll("[data-ui='menu'] [data-part='content']");

  const openThird = async () => {
    TestBed.configureTestingModule({ imports: [ThreeLevels] });
    fixture = TestBed.createComponent(ThreeLevels);
    await settle();
    click(fixture.nativeElement.querySelector('button'));
    await settle();
    item('Send to')?.focus();
    press('ArrowRight');
    await settle();
    item('More')?.focus();
    press('ArrowRight');
    await settle();
  };

  it('opens the third level from the keyboard onto its first item', async () => {
    await openThird();
    expect(surfaces()).toHaveLength(3);
    expect(document.activeElement).toBe(item('Teams'));
    expect(item('More')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes only the topmost level on Escape, and returns focus to its parent item', async () => {
    await openThird();
    press('Escape');
    await settle();
    expect(surfaces()).toHaveLength(2);
    expect(document.activeElement).toBe(item('More'));
  });

  it('closes the third level on ArrowLeft and leaves the second open', async () => {
    await openThird();
    press('ArrowLeft');
    await settle();
    expect(surfaces()).toHaveLength(2);
    expect(document.activeElement).toBe(item('More'));
  });
});

@Component({
  standalone: true,
  imports: [SlMenu, SlMenuHeader, SlMenuItem, SlMenuItemDescription, SlMenuItemMeta, SlMenuTrigger],
  template: `
    <button [slMenuTriggerFor]="account">Account</button>
    <sl-menu #account aria-describedby="help">
      <div slMenuHeader>
        <span aria-hidden="true">AL</span>
        <span data-part="label" data-part-label="">Ada Lovelace</span>
        <span slMenuItemDescription>ada@analytical.engine</span>
      </div>
      <button slMenuItem>Inbox <span slMenuItemMeta>12</span></button>
      <button slMenuItem [slMenuTriggerFor]="status">
        Status <span slMenuItemMeta>Available</span>
      </button>
      <sl-menu #status>
        <button slMenuItem>Away</button>
      </sl-menu>
    </sl-menu>
  `,
})
class Account {}

describe('SlMenu header and meta', () => {
  let fixture: ComponentFixture<Account>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Account] });
    fixture = TestBed.createComponent(Account);
    fixture.detectChanges();
    await fixture.whenStable();
    click(fixture.nativeElement.querySelector('button'));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('describes the surface by its header, joined to the description the consumer gave', () => {
    const header = document.querySelector<HTMLElement>("[data-part='header']");
    expect(header).not.toBeNull();
    expect(surface()?.getAttribute('aria-describedby')).toBe(`help ${header?.id}`);
  });

  it('keeps the header out of the ring the arrows walk', () => {
    expect(document.querySelector("[data-part='header']")?.hasAttribute('tabindex')).toBe(false);
    expect(document.activeElement).toBe(item('Inbox'));
    press('ArrowUp');
    expect(document.activeElement).toBe(item('Status'));
  });

  it('projects the meta into its own part on an item and on a submenu trigger', () => {
    expect(item('Inbox')?.querySelector("[data-part='meta']")?.textContent).toBe('12');
    expect(item('Status')?.querySelector("[data-part='meta']")?.textContent).toBe('Available');
  });
});

@Component({
  standalone: true,
  imports: [SlButton, SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="document">Document</button>
    <sl-menu #document>
      <button slMenuItem>Duplicate</button>
    </sl-menu>
  `,
})
class ButtonTrigger {}

/**
 * On a plain control the trigger has no part of its own, so the part is the
 * control's: the library's button stays the root of its family, as React's
 * `MenuTrigger render={(props) => <Button {...props} />}` leaves it.
 */
describe('SlMenuTrigger on the library button', () => {
  it('leaves the button the root of its own family', () => {
    TestBed.configureTestingModule({ imports: [ButtonTrigger] });
    const fixture = TestBed.createComponent(ButtonTrigger);
    fixture.detectChanges();

    const control = fixture.nativeElement.querySelector('[data-ui="button"]') as HTMLElement;
    expect(control.getAttribute('data-part')).toBe('root');
    expect(control.getAttribute('aria-haspopup')).toBe('menu');
    expect(control.hasAttribute('role')).toBe(false);
  });
});

/** Another family's part, bound by a directive Angular runs before the trigger. */
@Directive({
  selector: '[probePart]',
  standalone: true,
  host: { '[attr.data-part]': '"menu-trigger"', '[attr.data-part-menu-trigger]': "''" },
})
class ProbePart {}

@Component({
  standalone: true,
  imports: [ProbePart, SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <button probePart aria-label="More ways to ship" [slMenuTriggerFor]="ship"></button>
    <sl-menu #ship>
      <button slMenuItem>Ship and print label</button>
    </sl-menu>
  `,
})
class BoundPartTrigger {}

/**
 * The trigger writes no part and no role on a plain control, so a part another
 * directive binds survives whichever order the two host bindings run in — the
 * split button's menu trigger is one, and the docs site's compiler runs its
 * binding before the trigger's.
 */
describe('SlMenuTrigger beside a directive that binds the part', () => {
  it('keeps the part the other directive binds', () => {
    TestBed.configureTestingModule({ imports: [BoundPartTrigger] });
    const fixture = TestBed.createComponent(BoundPartTrigger);
    fixture.detectChanges();

    const control = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(control.getAttribute('data-part')).toBe('menu-trigger');
    expect(control.getAttribute('aria-haspopup')).toBe('menu');
  });
});

@Component({
  standalone: true,
  imports: [SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <button [slMenuTriggerFor]="move">Move to</button>
    <sl-menu #move>
      <button slMenuItem>Amsterdam</button>
      <button slMenuItem>Berlin</button>
      <button slMenuItem>Zürich</button>
    </sl-menu>
  `,
})
class LongMenu {}

/**
 * The surface scrolls inside the room the positioner gives it, so an item the
 * arrows, Home, End or typeahead reach is brought into the surface rather than
 * by the browser's own focus scroll, which centers it in the window and
 * carried the whole layer off its trigger.
 */
describe('SlMenu in a surface that scrolls', () => {
  it('reveals the item it moves to inside the surface, without scrolling the page', async () => {
    TestBed.configureTestingModule({ imports: [LongMenu] });
    const fixture = TestBed.createComponent(LongMenu);
    fixture.detectChanges();
    const control = fixture.nativeElement.querySelector('button') as HTMLElement;
    control.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    await fixture.whenStable();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');

    const key = (name: string) =>
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name }),
      );
    const named = (label: string) =>
      [...document.querySelectorAll<HTMLElement>("[data-part='item']")].find(
        (node) => node.textContent?.trim() === label,
      );

    key('End');
    expect(document.activeElement).toBe(named('Zürich'));
    expect(focus.mock.contexts.at(-1)).toBe(named('Zürich'));
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });

    key('b');
    expect(document.activeElement).toBe(named('Berlin'));
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
    focus.mockRestore();
  });
});
