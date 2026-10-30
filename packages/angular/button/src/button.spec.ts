import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/button/contract.json';
import { SlButton } from './button';
import { SlButtonEnd, SlButtonStart } from './button-appearance';
import { provideButtonDefaults } from './button-defaults';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import type {
  ButtonJustify,
  ButtonSize,
  ButtonTone,
  ButtonType,
  ButtonVariant,
} from './button.constants';

const defaults = contract.members.button.defaults;

@Component({
  imports: [SlButton, SlButtonEnd, SlButtonStart],
  template: `<button
    slButton
    [tone]="tone()"
    [variant]="variant()"
    [size]="size()"
    [type]="type()"
    [disabled]="disabled()"
    [focusableWhenDisabled]="focusableWhenDisabled()"
    [fullWidth]="fullWidth()"
    [justify]="justify()"
    [loading]="loading()"
    [loadingDelay]="loadingDelay()"
    [messages]="{ loading: loadingMessage() }"
    (click)="onClick()"
  >
    @if (withIcons()) {
      <span slButtonStart>S</span>
    }
    Save
    @if (withIcons()) {
      <span slButtonEnd>E</span>
    }
  </button>`,
})
class TestHost {
  readonly tone = signal<ButtonTone>('accent');
  readonly variant = signal<ButtonVariant>('solid');
  readonly size = signal<ButtonSize>('md');
  readonly type = signal<ButtonType>('button');
  readonly disabled = signal(false);
  readonly focusableWhenDisabled = signal(false);
  readonly fullWidth = signal(false);
  readonly justify = signal<ButtonJustify>('center');
  readonly loading = signal(false);
  readonly loadingDelay = signal(0);
  readonly loadingMessage = signal('Loading');
  readonly withIcons = signal(false);
  readonly onClick = vi.fn();
}

/** A host that states no axis, so the injected defaults are what is read. */
@Component({
  imports: [SlButton],
  template: `<button slButton>Inherits</button>
    <button slButton tone="danger">States its own</button>`,
})
class DefaultsHost {}

function mount() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { button, fixture, host: fixture.componentInstance };
}

describe('SlButton', () => {
  it('is the platform’s own button, carrying the family identity', () => {
    const { button } = mount();

    expect(button.localName).toBe(contract.members.button.nativeElement);
    expect(button.getAttribute('data-ui')).toBe(contract.ui);
    expect(button.getAttribute('data-part')).toBe('root');
    expect(button.getAttribute('type')).toBe(defaults.type);
    expect(button.getAttribute('data-tone')).toBe(defaults.tone);
    expect(button.getAttribute('data-variant')).toBe(defaults.variant);
    expect(button.getAttribute('data-size')).toBe(defaults.size);
  });

  it('never announces itself as a toggle', () => {
    const { button } = mount();
    expect(button.hasAttribute('aria-pressed')).toBe(false);
  });

  it('writes every axis the contract declares', () => {
    const { button, fixture, host } = mount();

    for (const tone of BUTTON_TONES) {
      host.tone.set(tone);
      fixture.detectChanges();
      expect(button.getAttribute('data-tone')).toBe(tone);
    }
    for (const variant of BUTTON_VARIANTS) {
      host.variant.set(variant);
      fixture.detectChanges();
      expect(button.getAttribute('data-variant')).toBe(variant);
    }
    for (const size of BUTTON_SIZES) {
      host.size.set(size);
      fixture.detectChanges();
      expect(button.getAttribute('data-size')).toBe(size);
    }
  });

  it('marks each part on the element the consumer wrote, and never an empty one', () => {
    const { button, fixture, host } = mount();
    expect(
      [...button.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part')),
    ).toEqual(['label']);

    host.withIcons.set(true);
    fixture.detectChanges();
    expect(
      [...button.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part')),
    ).toEqual(['start', 'label', 'end']);
  });

  it('leaves the disabled state to the platform', () => {
    const { button, fixture, host } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('data-disabled')).toBe('');
    expect(host.onClick).not.toHaveBeenCalled();
  });

  /** The name has to survive the wait, so the label stays rendered. */
  it('keeps its label and says it is unavailable while it waits', () => {
    const { button, fixture, host } = mount();
    host.loading.set(true);
    fixture.detectChanges();

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('data-loading')).toBe('');
    expect(button.querySelector('[data-part="label"]')?.textContent?.trim()).toBe('Save');
  });

  /**
   * A waiting control keeps its place in the tab sequence. Focus has to survive
   * an action the person just started, or the keyboard lands somewhere else
   * mid-task — which is why the refusal is `aria-disabled` and a blocked
   * activation rather than the attribute that removes the control.
   */
  it('stays focusable while it waits', () => {
    const { button, fixture, host } = mount();
    host.loading.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('refuses activation while it waits, before any handler the template attached', () => {
    const { button, fixture, host } = mount();
    host.loading.set(true);
    fixture.detectChanges();

    button.click();
    expect(host.onClick).not.toHaveBeenCalled();
  });

  /**
   * The wait is announced by a named progress bar rather than by `aria-busy`,
   * which is not reliably announced on a button. The label stays at zero
   * opacity, so the two names combine.
   */
  it('announces the wait as a named progress bar', () => {
    const { button, fixture, host } = mount();
    expect(button.querySelector('[data-part="indicator"]')).toBeNull();

    host.loadingMessage.set('Saving');
    host.loading.set(true);
    fixture.detectChanges();
    const indicator = button.querySelector('[data-part="indicator"]');

    expect(indicator).not.toBeNull();
    expect(indicator?.getAttribute('role')).toBe('progressbar');
    expect(indicator?.getAttribute('aria-label')).toBe('Saving');
    expect(indicator?.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('names the ring in the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    TestBed.overrideComponent(TestHost, {
      set: { template: '<button slButton loading>Save</button>' },
    });
    const { button, fixture } = mount();
    const label = () => button.querySelector('[data-part="indicator"]')?.getAttribute('aria-label');

    expect(label()).toBe('Carregando');

    locale.set('en-US');
    fixture.detectChanges();
    expect(label()).toBe('Loading');
  });

  /**
   * The ring takes the first visual slot the control has, because that box was
   * already the size of it: the glyph fades under it and the label stays
   * readable. Only a control with no slot draws a ring of its own.
   */
  it('gives the ring the projected icon’s own box when the control has one', () => {
    const { button, fixture, host } = mount();
    host.withIcons.set(true);
    host.loading.set(true);
    fixture.detectChanges();

    const start = button.querySelector('[data-part="start"]');
    expect(start?.querySelector('[data-part="indicator"]')).not.toBeNull();
    expect(start?.textContent).toContain('S');
    expect(button.querySelector(':scope > [data-part="indicator"]')).toBeNull();
  });

  /* The ring is the shared spinner, drawn once for every family that waits. */
  it('draws the ring in a start slot with the shared spinner', () => {
    const { button, fixture, host } = mount();
    host.withIcons.set(true);
    host.loading.set(true);
    fixture.detectChanges();

    const indicator = button.querySelector('[data-part="start"] > [data-part="indicator"]');
    expect(indicator?.getAttribute('data-ui')).toBe('spinner');
  });

  it('draws the ring in an end slot with the shared spinner', () => {
    TestBed.overrideComponent(TestHost, {
      set: { template: '<button slButton loading>Save<span slButtonEnd>E</span></button>' },
    });
    const { button } = mount();

    const indicator = button.querySelector('[data-part="end"] > [data-part="indicator"]');
    expect(indicator?.getAttribute('data-ui')).toBe('spinner');
  });

  it('centers a ring of its own when the control has no visual slot', () => {
    const { button, fixture, host } = mount();
    host.loading.set(true);
    fixture.detectChanges();

    expect(button.querySelector(':scope > [data-part="indicator"]')).not.toBeNull();
  });

  /**
   * The action is refused from the first millisecond; only the picture waits.
   * A spinner shown for ninety of them is a flash rather than a status.
   */
  it('delays the ring without letting the action through', () => {
    vi.useFakeTimers();
    try {
      const { button, fixture, host } = mount();
      host.loadingDelay.set(300);
      host.loading.set(true);
      fixture.detectChanges();

      expect(button.querySelector('[data-part="indicator"]')).toBeNull();
      button.click();
      expect(host.onClick).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(button.querySelector('[data-part="indicator"]')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * Being unavailable and being unreachable are two decisions. A disabled
   * control in a toolbar that leaves the tab sequence takes its tooltip and
   * its explanation with it.
   */
  it('can be unavailable and still reachable by keyboard', () => {
    const { button, fixture, host } = mount();
    host.disabled.set(true);
    host.focusableWhenDisabled.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('data-disabled')).toBe('');
    button.focus();
    expect(document.activeElement).toBe(button);

    button.click();
    expect(host.onClick).not.toHaveBeenCalled();
  });

  it('keeps the native type the consumer asked for', () => {
    const { button, fixture, host } = mount();
    host.type.set('submit');
    fixture.detectChanges();

    expect(button.getAttribute('type')).toBe('submit');
  });

  it('fills its container only when asked', () => {
    const { button, fixture, host } = mount();
    expect(button.hasAttribute('data-full-width')).toBe(false);

    host.fullWidth.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('data-full-width')).toBe('');
  });

  /**
   * A field trigger sets its label at the start and its end slot at the
   * inline end; the stylesheet spreads the two under `data-justify`.
   */
  it('writes how its content is justified, centerd unless asked to spread', () => {
    const { button, fixture, host } = mount();
    expect(button.getAttribute('data-justify')).toBe(defaults.justify);

    host.fullWidth.set(true);
    host.justify.set('between');
    host.withIcons.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('data-justify')).toBe('between');
  });

  /**
   * An application decides once, and an axis it leaves unset keeps each member
   * the default it was designed with. A button that states an axis itself
   * always wins: an explicit input is never overridden by the token.
   */
  it('takes an application’s defaults, and yields to an explicit value', () => {
    TestBed.configureTestingModule({
      providers: [provideButtonDefaults({ size: 'sm', tone: 'success' })],
    });

    const fixture = TestBed.createComponent(DefaultsHost);
    fixture.detectChanges();
    const [inherited, explicit] = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ];

    expect(inherited?.getAttribute('data-size')).toBe('sm');
    expect(inherited?.getAttribute('data-tone')).toBe('success');
    /** An axis the application left unset keeps the member's own default. */
    expect(inherited?.getAttribute('data-variant')).toBe(defaults.variant);

    expect(explicit?.getAttribute('data-tone')).toBe('danger');
    expect(explicit?.getAttribute('data-size')).toBe('sm');
  });
});
