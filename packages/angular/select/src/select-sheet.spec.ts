import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SlSelect } from './select';
import { provideSelectDefaults } from './select-defaults';
import { SlSelectItem } from './select-items';

@Component({
  standalone: true,
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem],
  template: '',
})
class Host {
  readonly value = signal<unknown>(null);
}

const trigger = () => document.querySelector<HTMLButtonElement>("[data-part='trigger']")!;
const layer = () =>
  document.querySelector<HTMLElement>('[data-ui="select"][data-part="positioner"]');

async function open(attributes: string, phone: boolean, providers: unknown[] = []) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: phone && query === '(max-width: 480px) and (pointer: coarse)',
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, {
    set: {
      template: `<div slField>
        <label slFieldLabel>Group by</label>
        <sl-select ${attributes} (valueChange)="value.set($event)">
          <sl-select-item value="day">Day</sl-select-item>
          <sl-select-item value="week">Week</sl-select-item>
          <sl-select-item value="month">Month</sl-select-item>
        </sl-select>
      </div>`,
    },
  });
  const fixture = TestBed.createComponent(Host);
  const settle = async () => {
    for (let turn = 0; turn < 3; turn += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
  };
  await settle();
  trigger().click();
  await settle();

  return { fixture, settle };
}

/**
 * A select on a phone opened a listbox narrower than a thumb's reach of the
 * screen, anchored to its trigger, beside a date field that rose as a sheet.
 */
describe('the listbox of a select on a phone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('is a modal sheet named by the label under presentation="auto"', async () => {
    const { fixture, settle } = await open('presentation="auto"', true);
    const dialog = layer()!.querySelector<HTMLElement>('[role="dialog"]')!;
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    const list = dialog.querySelector<HTMLElement>('[role="listbox"]')!;
    const choices = [...list.querySelectorAll<HTMLElement>('[role="option"]')];

    expect(layer()!.dataset['presentation']).toBe('sheet');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(heading?.textContent?.trim()).toBe('Group by');
    expect(choices.map((option) => option.textContent?.trim())).toEqual(['Day', 'Week', 'Month']);
    expect(document.activeElement).toBe(list);
    expect(trigger().closest('[inert]')).not.toBeNull();

    choices[1]!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    choices[1]!.click();
    await settle();

    expect(fixture.componentInstance.value()).toBe('week');
    expect(layer()?.hasAttribute('data-open') ?? false).toBe(false);
    expect(document.activeElement).toBe(trigger());
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('closes on a press on the scrim, with focus on the trigger', async () => {
    const { settle } = await open('presentation="auto"', true);

    layer()!.querySelector<HTMLElement>(':scope > [data-part="backdrop"]')!.click();
    await settle();

    expect(layer()?.hasAttribute('data-open') ?? false).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it('takes the keys on the list that holds focus', async () => {
    const { fixture, settle } = await open('presentation="auto"', true);
    const list = layer()!.querySelector<HTMLElement>('[role="listbox"]')!;

    for (const key of ['ArrowDown', 'ArrowDown', 'Enter']) {
      list.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
      await settle();
    }

    expect(fixture.componentInstance.value()).toBe('month');
  });

  it('is a sheet for every select under the provider', async () => {
    await open('', true, [provideSelectDefaults({ presentation: 'auto' })]);

    expect(layer()!.dataset['presentation']).toBe('sheet');
  });

  it.each([
    ['presentation="auto" on a wide screen', 'presentation="auto"', false],
    ['presentation="auto" with a search field', 'presentation="auto" search', true],
    ['no presentation on a phone', '', true],
    ['no presentation on a wide screen', '', false],
  ])('is the anchored listbox with %s', async (_, attributes, phone) => {
    await open(attributes, phone);

    expect(layer()!.dataset['presentation']).toBe('popover');
    expect(layer()!.querySelector('[data-part="backdrop"], [aria-modal]')).toBeNull();
    expect(document.querySelector('[inert]')).toBeNull();
  });
});
