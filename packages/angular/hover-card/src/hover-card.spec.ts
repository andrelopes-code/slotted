import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import {
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverFooter,
  SlPopoverLayer,
  SlPopoverTitle,
} from '@slotted/angular/popover';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/hover-card/contract.json';
import { SlHoverCard } from './hover-card';
import { provideHoverCardDefaults } from './hover-card-defaults';
import { SlHoverCardTrigger } from './hover-card-trigger';

@Component({
  standalone: true,
  imports: [
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverLayer,
    SlPopoverContent,
    SlPopoverBody,
    SlPopoverTitle,
    SlPopoverFooter,
  ],
  template: `
    <p>
      Assigned to
      <ng-container
        slHoverCard
        [navigable]="navigable()"
        [disabled]="disabled()"
        (openChangeRequest)="reasons.push($event.reason)"
      >
        <a slHoverCardTrigger href="/people/ana">&#64;ana.souza</a>
        <a slHoverCardTrigger href="/people/marcus">&#64;marcus.lee</a>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverTitle>Ana Souza</div>
            <div slPopoverBody>Product, Billing</div>
            @if (navigable()) {
              <div slPopoverFooter><button type="button">Follow</button></div>
            }
          </div>
        </ng-template>
      </ng-container>
      for review.
    </p>
  `,
})
class Host {
  readonly navigable = signal(false);
  readonly disabled = signal(false);
  readonly reasons: string[] = [];
}

const layer = () => document.querySelector<HTMLElement>("[data-ui='popover']");
const panel = () =>
  document.querySelector<HTMLElement>("[data-ui='popover'] [data-part='content']");
const triggers = () => [...document.querySelectorAll<HTMLElement>("[data-ui='hover-card']")];
const ana = () => triggers()[0]!;

const pointer = (element: Element, type: string, pointerType = 'mouse') =>
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType }));

describe('slHoverCard', () => {
  let fixture: ComponentFixture<Host>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  /** A `Tab` before the focus is what makes jsdom read it as `:focus-visible`. */
  const focusByKeyboard = (element: HTMLElement) => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    element.focus();
    element.dispatchEvent(new FocusEvent('focus'));
  };

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('owns the link as its root and holds the popover unchanged', async () => {
    const root = ana();
    expect(root.tagName).toBe('A');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.hasAttribute('aria-haspopup')).toBe(false);
    expect(layer()).toBeNull();

    pointer(root, 'pointerenter');
    vi.advanceTimersByTime(600);
    await settle();

    expect(layer()).not.toBeNull();
    expect(panel()?.getAttribute('role')).toBe('presentation');
    expect(root.hasAttribute('data-open')).toBe(true);
    expect(fixture.componentInstance.reasons).toEqual(['pointer']);
    expect(contract.members.hoverCard.parts).toEqual(['root']);
  });

  it('waits openDelay, and a pointer that leaves first opens nothing', async () => {
    /* Well short of the delay: fake time also runs with the real clock while
       the fixture settles, so a one-millisecond margin is not one. */
    pointer(ana(), 'pointerenter');
    vi.advanceTimersByTime(300);
    await settle();
    expect(layer()).toBeNull();
    pointer(ana(), 'pointerleave');
    vi.advanceTimersByTime(600);
    await settle();
    expect(layer()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual([]);
  });

  it('stays while the pointer is on the card and closes closeDelay after it leaves', async () => {
    pointer(ana(), 'pointerenter');
    vi.advanceTimersByTime(600);
    await settle();
    expect(layer()).not.toBeNull();

    pointer(ana(), 'pointerleave');
    pointer(layer()!, 'pointerenter');
    vi.advanceTimersByTime(1000);
    await settle();
    expect(layer()).not.toBeNull();

    pointer(layer()!, 'pointerleave');
    vi.advanceTimersByTime(300);
    await settle();
    expect(layer()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['pointer', 'pointer']);
  });

  it('opens at once on keyboard focus and closes with blur', async () => {
    const root = ana();
    focusByKeyboard(root);
    await settle();
    expect(layer()).not.toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['keyboard']);

    root.dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }));
    await settle();
    expect(layer()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['keyboard', 'blur']);
  });

  it('closes on Escape and does not reopen on the focus the trigger still holds', async () => {
    const root = ana();
    focusByKeyboard(root);
    await settle();
    expect(layer()).not.toBeNull();

    root.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    await settle();
    expect(layer()).toBeNull();
    expect(fixture.componentInstance.reasons.at(-1)).toBe('escape');

    root.dispatchEvent(new FocusEvent('focus'));
    vi.advanceTimersByTime(700);
    await settle();
    expect(layer()).toBeNull();

    root.dispatchEvent(new FocusEvent('blur'));
    focusByKeyboard(root);
    await settle();
    expect(layer()).not.toBeNull();
  });

  it('makes a navigable card a dialog the link announces and Tab enters', async () => {
    fixture.componentInstance.navigable.set(true);
    await settle();
    const root = ana();
    expect(root.getAttribute('aria-haspopup')).toBe('dialog');
    expect(root.getAttribute('aria-expanded')).toBe('false');

    focusByKeyboard(root);
    await settle();
    expect(panel()?.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-expanded')).toBe('true');
    expect(root.getAttribute('aria-controls')).toBe(panel()?.id);

    root.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    await settle();
    expect(document.activeElement?.textContent).toBe('Follow');

    const guards = document.querySelectorAll<HTMLElement>("[data-part='focus-guard']");
    guards[1]!.dispatchEvent(new FocusEvent('focus'));
    await settle();
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(root);
    root.dispatchEvent(new FocusEvent('focus'));
    vi.advanceTimersByTime(700);
    await settle();
    expect(layer()).toBeNull();
  });

  it('opens on a tap on touch instead of following the link, and follows it on the next', async () => {
    const root = ana();
    pointer(root, 'pointerdown', 'touch');
    const first = new MouseEvent('click', { bubbles: true, cancelable: true });
    root.dispatchEvent(first);
    await settle();
    expect(first.defaultPrevented).toBe(true);
    expect(layer()).not.toBeNull();

    pointer(root, 'pointerdown', 'touch');
    const second = new MouseEvent('click', { bubbles: true, cancelable: true });
    root.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
  });

  it('shares one card between many triggers, anchored to the one hovered', async () => {
    const marcus = triggers()[1]!;
    pointer(marcus, 'pointerenter');
    vi.advanceTimersByTime(600);
    await settle();

    expect(layer()).not.toBeNull();
    expect(marcus.hasAttribute('data-open')).toBe(true);
    expect(ana().hasAttribute('data-open')).toBe(false);
  });

  it('never opens while disabled, and the link keeps working', async () => {
    fixture.componentInstance.disabled.set(true);
    await settle();
    pointer(ana(), 'pointerenter');
    vi.advanceTimersByTime(700);
    await settle();
    expect(layer()).toBeNull();
    expect(ana().hasAttribute('data-disabled')).toBe(false);
  });
});

@Component({
  standalone: true,
  imports: [SlHoverCard, SlHoverCardTrigger, SlPopoverLayer, SlPopoverContent],
  providers: [provideHoverCardDefaults({ openDelay: 100 })],
  template: `
    <ng-container slHoverCard #card="slHoverCard">
      <a slHoverCardTrigger href="/x">x</a>
      <ng-template slPopoverLayer><div slPopoverContent>Preview</div></ng-template>
    </ng-container>
  `,
})
class DefaultsHost {}

describe('slHoverCard defaults', () => {
  it('takes its delays from the provider', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await TestBed.configureTestingModule({ imports: [DefaultsHost] }).compileComponents();
    const fixture = TestBed.createComponent(DefaultsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    document
      .querySelector("[data-ui='hover-card']")!
      .dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector("[data-ui='popover']")).not.toBeNull();

    fixture.destroy();
    vi.useRealTimers();
  });
});
