import { render } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TextField } from '../text-field';
import { Field } from './field';
import { FieldDefaultsProvider } from './field-defaults';
import { FieldHeader, FieldHelp, FieldLabel } from './field-parts';
import type { FieldHelpPresentation } from './field.types';

const HINT = 'The day of the month the payment is due.';

function DueDay({ presentation }: { presentation?: FieldHelpPresentation }) {
  return (
    <Field required>
      <FieldHeader>
        <FieldLabel>Due day</FieldLabel>
        <FieldHelp presentation={presentation}>{HINT}</FieldHelp>
      </FieldHeader>
      <TextField />
    </Field>
  );
}

const help = () => document.querySelector<HTMLElement>('button[data-part="help"]')!;
const sheet = () => document.querySelector<HTMLElement>('[data-ui="popover"][data-open]');
const toggletip = () => document.querySelector<HTMLElement>('[data-ui="tooltip"][data-open]');

async function settle() {
  for (let index = 0; index < 5; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  await Promise.allSettled(document.getAnimations().map((animation) => animation.finished));
}

/**
 * The help of a field stayed an anchored toggletip on a phone, beside the help
 * of a widget that opens as a sheet: one question mark, two behaviours.
 */
describe('the help of a field on a phone', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('is a modal sheet named by the label under presentation="auto"', async () => {
    await page.viewport(390, 844);
    render(<DueDay presentation="auto" />);

    await userEvent.click(help());
    await vi.waitFor(() => expect(sheet()).not.toBeNull());
    await settle();
    const dialog = sheet()!.querySelector<HTMLElement>('[role="dialog"]')!;
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;

    expect(sheet()!.dataset['presentation']).toBe('sheet');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(heading.textContent).toBe('Due day');
    expect(dialog.textContent).toContain(HINT);
    expect(dialog.querySelector('[data-part="close"]')).not.toBeNull();
    expect(help().getAttribute('aria-describedby')).toContain(
      document.querySelector('[data-part="help-text"]')!.id,
    );

    const scrim = sheet()!.querySelector<HTMLElement>('[data-part="backdrop"]')!;
    await userEvent.click(scrim, { position: { x: 195, y: 40 } });
    await vi.waitFor(() => expect(sheet()).toBeNull());

    expect(document.activeElement).toBe(help());
  });

  it('is a sheet for every help under the defaults provider', async () => {
    await page.viewport(390, 844);
    render(
      <FieldDefaultsProvider helpPresentation="auto">
        <DueDay />
      </FieldDefaultsProvider>,
    );

    await userEvent.click(help());
    await vi.waitFor(() => expect(sheet()?.dataset['presentation']).toBe('sheet'));
  });

  it.each([
    ['a phone', 390],
    ['a wide screen', 1024],
  ])('is the toggletip without presentation, on %s', async (_, width) => {
    await page.viewport(width, 844);
    render(<DueDay />);

    await userEvent.click(help());
    await vi.waitFor(() => expect(toggletip()?.textContent).toContain(HINT));

    expect(document.querySelector('[data-ui="popover"]')).toBeNull();
  });

  it('is the toggletip under presentation="auto" on a wide screen', async () => {
    await page.viewport(1024, 844);
    render(<DueDay presentation="auto" />);

    await userEvent.click(help());
    await vi.waitFor(() => expect(toggletip()?.textContent).toContain(HINT));

    expect(document.querySelector('[data-ui="popover"]')).toBeNull();
  });
});
