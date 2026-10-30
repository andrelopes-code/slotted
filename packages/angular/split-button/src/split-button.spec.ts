import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideButtonDefaults, SlButtonStart } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup } from '@slotted/angular/menu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/split-button/contract.json';
import { SlSplitButton } from './split-button';
import { provideSplitButtonDefaults } from './split-button-defaults';
import {
  SlSplitButtonChoices,
  SlSplitButtonMenuTrigger,
  SlSplitButtonPrimary,
} from './split-button-parts';

@Component({
  standalone: true,
  imports: [
    SlSplitButton,
    SlSplitButtonPrimary,
    SlSplitButtonMenuTrigger,
    SlSplitButtonChoices,
    SlButtonStart,
    SlMenu,
    SlMenuItem,
    SlMenuRadioGroup,
  ],
  template: `
    <div
      slSplitButton
      class="save"
      [tone]="tone()"
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      [loading]="loading()"
      [fullWidth]="fullWidth()"
    >
      <button
        slSplitButtonPrimary
        type="submit"
        [disabled]="primaryDisabled()"
        (click)="saved = saved + 1"
      >
        Save
      </button>
      <button
        slSplitButtonMenuTrigger
        [slMenuTriggerFor]="more"
        aria-label="More save options"
        [disabled]="triggerDisabled()"
        (click)="triggerClicks = triggerClicks + 1"
      ></button>
      <sl-menu #more (openChangeRequest)="reasons.push($event.reason)">
        <button slMenuItem>Save as draft</button>
        <button slMenuItem>Save and close</button>
      </sl-menu>
    </div>
  `,
})
class Host {
  readonly tone = signal<'accent' | 'secondary' | 'success' | 'warning' | 'danger' | undefined>(
    undefined,
  );
  readonly variant = signal<'solid' | 'outline' | 'ghost' | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly fullWidth = signal(false);
  readonly primaryDisabled = signal(false);
  readonly triggerDisabled = signal(false);
  saved = 0;
  triggerClicks = 0;
  readonly reasons: string[] = [];
}

@Component({
  standalone: true,
  imports: [
    SlSplitButton,
    SlSplitButtonPrimary,
    SlSplitButtonMenuTrigger,
    SlSplitButtonChoices,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuRadioGroup,
  ],
  template: `
    <div
      slSplitButton
      remember
      [value]="value()"
      [defaultValue]="defaultValue"
      (valueChange)="record($event)"
    >
      <button slSplitButtonPrimary>{{ labels[value() ?? held ?? 'merge'] }}</button>
      <button slSplitButtonMenuTrigger [slMenuTriggerFor]="more" aria-label="More merge options">
        <span slIcon><svg slGlyph name="ellipsis"></svg></span>
      </button>
      <sl-menu #more>
        <sl-menu-radio-group slSplitButtonChoices (valueChange)="held = $event">
          <button slMenuRadioItem value="merge">Create a merge commit</button>
          <button slMenuRadioItem value="squash">Squash and merge</button>
          <button slMenuRadioItem value="rebase">Rebase and merge</button>
        </sl-menu-radio-group>
      </sl-menu>
    </div>
  `,
})
class Remember {
  readonly labels: Record<string, string> = {
    merge: 'Create a merge commit',
    squash: 'Squash and merge',
    rebase: 'Rebase and merge',
  };
  readonly value = signal<string | undefined>(undefined);
  defaultValue: string | undefined = undefined;
  held: string | undefined = undefined;
  follow = true;
  cancel = false;
  readonly requests: { value: string; previous: string; reason: string }[] = [];

  record(request: { value: string; previous: string; reason: string; cancel: () => void }) {
    this.requests.push({
      value: request.value,
      previous: request.previous,
      reason: request.reason,
    });
    if (this.cancel) request.cancel();
    else if (this.follow && this.value() !== undefined) this.value.set(request.value);
  }
}

const root = () => document.querySelector<HTMLElement>("[data-ui='split-button']")!;
const primary = () => document.querySelector<HTMLButtonElement>("[data-part='primary']")!;
const trigger = () => document.querySelector<HTMLButtonElement>("[data-part='menu-trigger']")!;
const surface = () => document.querySelector<HTMLElement>("[data-ui='menu'] [role='menu']");
const radio = (label: string) =>
  [...document.querySelectorAll<HTMLElement>("[role='menuitemradio']")].find(
    (node) => node.textContent?.trim() === label,
  )!;

function click(element: HTMLElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

function press(element: HTMLElement, key: string) {
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
}

describe('slSplitButton', () => {
  let fixture: ComponentFixture<Host>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  async function mount(providers: unknown[] = []) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: providers as never[],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle();
  }

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await mount();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('is a group of two button elements carrying this family’s parts', () => {
    expect(root().tagName).toBe('DIV');
    expect(root().getAttribute('role')).toBe('group');
    expect(root().getAttribute('data-ui')).toBe(contract.ui);
    expect(root().getAttribute('data-part')).toBe('root');
    expect(root().classList.contains('save')).toBe(true);

    expect(primary().getAttribute('data-ui')).toBe('button');
    expect(primary().querySelector("[data-part='label']")?.textContent?.trim()).toBe('Save');
    expect(primary().getAttribute('type')).toBe('submit');

    expect(trigger().getAttribute('data-ui')).toBe('button');
    expect(trigger().getAttribute('data-shape')).toBe('square');
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-label')).toBe('More save options');
    expect(
      trigger().querySelector("[data-part='icon'] > [data-ui='icon']")?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(
      trigger().querySelector(
        "[data-part='icon'] > [data-ui='icon'] > svg[data-glyph='chevron-down']",
      ),
    ).not.toBeNull();
    /* The menu's element stands in the root and takes no room. */
    expect(getComputedStyle(root().querySelector('sl-menu')!).display).toBe('none');
  });

  it('hands one appearance to both halves, from the input, the provider, button’s provider, then the contract', async () => {
    const defaults = contract.members.splitButton.defaults;
    for (const half of [root(), primary(), trigger()]) {
      expect(half.getAttribute('data-tone')).toBe(defaults.tone);
      expect(half.getAttribute('data-variant')).toBe(defaults.variant);
      expect(half.getAttribute('data-size')).toBe(defaults.size);
    }

    fixture.componentInstance.tone.set('danger');
    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.size.set('sm');
    await settle();
    for (const half of [root(), primary(), trigger()]) {
      expect(half.getAttribute('data-tone')).toBe('danger');
      expect(half.getAttribute('data-variant')).toBe('outline');
      expect(half.getAttribute('data-size')).toBe('sm');
    }

    fixture.destroy();
    await mount([
      provideButtonDefaults({ tone: 'secondary', variant: 'ghost' }),
      provideSplitButtonDefaults({ size: 'lg', tone: 'success' }),
    ]);
    expect(primary().getAttribute('data-tone')).toBe('success');
    expect(primary().getAttribute('data-variant')).toBe('ghost');
    expect(primary().getAttribute('data-size')).toBe('lg');
  });

  it('runs the action from the primary and opens the menu from the trigger', async () => {
    click(primary());
    expect(fixture.componentInstance.saved).toBe(1);
    expect(surface()).toBeNull();

    click(trigger());
    await settle();
    expect(surface()).not.toBeNull();
    expect(fixture.componentInstance.triggerClicks).toBe(1);
    expect(fixture.componentInstance.reasons).toEqual(['pointer']);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().hasAttribute('data-open')).toBe(true);
    expect(trigger().getAttribute('data-part')).toBe('menu-trigger');
  });

  it('opens on ArrowDown from the trigger and never from the primary', async () => {
    press(primary(), 'ArrowDown');
    await settle();
    expect(surface()).toBeNull();

    press(trigger(), 'ArrowDown');
    await settle();
    expect(surface()).not.toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['keyboard']);
  });

  it('takes both halves out when disabled, and each half on its own', async () => {
    fixture.componentInstance.disabled.set(true);
    await settle();
    expect(root().hasAttribute('data-disabled')).toBe(true);
    expect(primary().disabled).toBe(true);
    expect(primary().hasAttribute('data-disabled')).toBe(true);
    expect(trigger().disabled).toBe(true);
    expect(trigger().hasAttribute('data-disabled')).toBe(true);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.primaryDisabled.set(true);
    await settle();
    expect(primary().disabled).toBe(true);
    expect(trigger().disabled).toBe(false);

    fixture.componentInstance.primaryDisabled.set(false);
    fixture.componentInstance.triggerDisabled.set(true);
    await settle();
    expect(primary().disabled).toBe(false);
    expect(trigger().disabled).toBe(true);
  });

  /**
   * The primary waits with `button`'s indicator; the trigger is
   * `aria-disabled`, focusable, named, and keeps its paint — no
   * `data-disabled` — and refuses the click and the opening keys.
   */
  it('blocks the menu while the action is in flight, keeping the trigger reachable and painted', async () => {
    fixture.componentInstance.loading.set(true);
    await settle();

    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(primary().hasAttribute('data-loading')).toBe(true);
    expect(primary().getAttribute('aria-disabled')).toBe('true');
    expect(primary().querySelector("[data-part='indicator']")).not.toBeNull();
    expect(trigger().getAttribute('aria-disabled')).toBe('true');
    expect(trigger().disabled).toBe(false);
    expect(trigger().hasAttribute('data-disabled')).toBe(false);
    expect(trigger().hasAttribute('data-loading')).toBe(false);

    click(trigger());
    press(trigger(), 'ArrowDown');
    press(trigger(), 'Enter');
    await settle();
    expect(surface()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual([]);
    expect(fixture.componentInstance.triggerClicks).toBe(0);

    click(primary());
    expect(fixture.componentInstance.saved).toBe(0);
  });

  it('marks full width on the root', async () => {
    fixture.componentInstance.fullWidth.set(true);
    await settle();
    expect(root().hasAttribute('data-full-width')).toBe(true);
  });

  it('declares in the contract the models it surfaces', () => {
    expect(contract.stateModel.selection).toEqual({
      controlled: 'value',
      uncontrolled: 'defaultValue',
      request: 'onValueChange',
      reasons: ['pointer', 'keyboard'],
    });
  });
});

describe('slSplitButtonChoices', () => {
  let fixture: ComponentFixture<Remember>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const open = async () => {
    /* A radio item leaves the menu open, so a second call finds it there. */
    if (surface() === null) {
      click(document.querySelector<HTMLElement>("[data-part='menu-trigger']")!);
      await settle();
    }
    expect(surface()).not.toBeNull();
  };

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [Remember] }).compileComponents();
    fixture = TestBed.createComponent(Remember);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('remembers the chosen alternative as the root’s value when controlled', async () => {
    fixture.componentInstance.value.set('squash');
    await settle();
    /* The consumer's own mark replaces the chevron, as popover's close does. */
    const menuTrigger = fixture.nativeElement.querySelector('[data-part="menu-trigger"]');
    expect(menuTrigger.querySelector('svg[data-glyph="ellipsis"]')).not.toBeNull();
    expect(menuTrigger.querySelector('svg[data-glyph="chevron-down"]')).toBeNull();
    await open();
    expect(radio('Squash and merge').getAttribute('aria-checked')).toBe('true');

    click(radio('Rebase and merge'));
    await settle();
    expect(fixture.componentInstance.requests).toEqual([
      { value: 'rebase', previous: 'squash', reason: 'pointer' },
    ]);
    expect(primary().textContent?.trim()).toBe('Rebase and merge');

    await open();
    expect(radio('Rebase and merge').getAttribute('aria-checked')).toBe('true');
  });

  it('shows nothing the consumer did not agree to', async () => {
    fixture.componentInstance.value.set('squash');
    fixture.componentInstance.cancel = true;
    await settle();
    await open();

    click(radio('Rebase and merge'));
    await settle();
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(primary().textContent?.trim()).toBe('Squash and merge');
    await open();
    expect(radio('Squash and merge').getAttribute('aria-checked')).toBe('true');
    expect(radio('Rebase and merge').getAttribute('aria-checked')).toBe('false');
  });

  it('holds the value itself when uncontrolled, starting from defaultValue', async () => {
    fixture.componentInstance.defaultValue = 'merge';
    await settle();
    await open();
    expect(radio('Create a merge commit').getAttribute('aria-checked')).toBe('true');

    click(radio('Squash and merge'));
    await settle();
    expect(fixture.componentInstance.requests).toEqual([
      { value: 'squash', previous: 'merge', reason: 'pointer' },
    ]);
    await open();
    expect(radio('Squash and merge').getAttribute('aria-checked')).toBe('true');
  });
});
