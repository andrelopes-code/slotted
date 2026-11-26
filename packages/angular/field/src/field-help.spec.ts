import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SlField } from './field';
import { provideFieldDefaults } from './field-defaults';
import { SlFieldControl, SlFieldLabel } from './field-parts';
import { SlFieldHeader, SlFieldHelp } from './field-header';

const HINT = 'The day of the month the payment is due.';

@Component({
  standalone: true,
  imports: [SlField, SlFieldControl, SlFieldHeader, SlFieldHelp, SlFieldLabel],
  template: '',
})
class Host {}

const sheet = () => document.querySelector<HTMLElement>('[data-ui="popover"]');
const toggletip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

async function press(presentation: string, phone: boolean, providers: unknown[] = []) {
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
      template: `<div slField required>
        <div slFieldHeader>
          <label slFieldLabel>Due day</label>
          <button slFieldHelp="${HINT}" ${presentation}></button>
        </div>
        <input slFieldControl />
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

  const help = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    'button[data-part="help"]',
  )!;
  help.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  await settle();

  return { help, settle };
}

/**
 * The help of a field stayed an anchored toggletip on a phone, beside the help
 * of a widget that opens as a sheet: one question mark, two behaviours.
 */
describe('the help of a field on a phone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('is a modal sheet named by the label under presentation="auto"', async () => {
    const { help, settle } = await press('presentation="auto"', true);
    const dialog = sheet()!.querySelector<HTMLElement>('[role="dialog"]')!;
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!);

    expect(sheet()!.dataset['presentation']).toBe('sheet');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(heading?.textContent?.trim()).toBe('Due day');
    expect(dialog.textContent).toContain(HINT);
    expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(toggletip()).toBeNull();

    sheet()!.querySelector<HTMLElement>('[data-part="backdrop"]')!.click();
    await settle();

    expect(help.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(help);
  });

  it('is a sheet for every help under the field defaults', async () => {
    await press('', true, [provideFieldDefaults({ helpPresentation: 'auto' })]);

    expect(sheet()?.dataset['presentation']).toBe('sheet');
  });

  it.each([
    ['presentation="auto" on a wide screen', 'presentation="auto"', false],
    ['no presentation on a phone', '', true],
    ['no presentation on a wide screen', '', false],
  ])('is the toggletip with %s', async (_, presentation, phone) => {
    const { help } = await press(presentation, phone);

    expect(toggletip()?.textContent).toContain(HINT);
    expect(sheet()).toBeNull();
    expect(help.hasAttribute('aria-haspopup')).toBe(false);
  });
});
