import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { EntityPicker } from './entity-picker';
import {
  EntityPickerOptionDescription,
  EntityPickerOptionLabel,
} from './entity-picker-option-parts';

const PEOPLE = [
  { id: 'ana', label: 'Ana Silva', team: 'Finance' },
  { id: 'bruno', label: 'Bruno Costa', team: 'Sales' },
];

/**
 * An option written as the reference page writes it keeps the family's row:
 * the face in the first column, the name in the second. A span carrying
 * `data-part="label"` alone had no selector key and fell out of the grid.
 */
describe('an option written through renderOption', () => {
  it('places the name in the second column of the row', async () => {
    render(
      <EntityPicker
        aria-label="Owner"
        items={PEOPLE}
        openOn="focus"
        renderOption={(person) => (
          <>
            <EntityPickerOptionLabel>{person.label}</EntityPickerOptionLabel>
            <EntityPickerOptionDescription>
              {(person as (typeof PEOPLE)[number]).team}
            </EntityPickerOptionDescription>
          </>
        )}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Owner' }));
    const option = await screen.findByRole('option', { name: /Ana Silva/ });
    const label = option.querySelector('[data-part="label"]') as HTMLElement;

    expect(getComputedStyle(label).gridColumnStart).toBe('2');
  });
});

const MANY = Array.from({ length: 150 }, (_, index) => ({
  id: `p${String(index)}`,
  label: `Person ${String(index).padStart(3, '0')}`,
  avatar: { src: `data:image/gif;base64,R0lGODlhAQABAAAAACw=` },
}));

/**
 * Every keystroke over 500 records with faces rendered all 500, and typing
 * lagged. 150 records keep the list above the windowing threshold and the
 * keyboard walk inside the test's time under the full suite's load. Only the options in view are drawn; the keyboard still reaches the
 * last match, the list scrolling to it as it goes.
 */
describe('a long list of records', () => {
  it('draws the options in view and reaches the last match from the keyboard', async () => {
    render(<EntityPicker aria-label="Owner" items={MANY} searchDelay={0} />);
    const input = screen.getByRole('combobox', { name: 'Owner' });
    await userEvent.click(input);
    await userEvent.keyboard('P');
    await screen.findAllByRole('option');

    expect(document.querySelectorAll('[role="option"]').length).toBeLessThan(60);

    await userEvent.keyboard('{ArrowDown>150/}');
    const last = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
    expect(last?.textContent).toContain('Person 149');
    expect(document.querySelectorAll('[role="option"]').length).toBeLessThan(60);
  });
});
