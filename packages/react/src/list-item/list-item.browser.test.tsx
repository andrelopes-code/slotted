import { render } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Checkbox } from '../checkbox';
import { ListItem, ListItemBody, ListItemLabel, ListItemLink, ListItemSelect } from './index';

/* A link row selected for a bulk command: the checkbox stands before the link, never inside it. */
describe('a link row with a leading checkbox', () => {
  it('keeps the checkbox outside the anchor, first in order and in the first column', async () => {
    render(
      <ul>
        <ListItem selected>
          <ListItemSelect>
            <Checkbox aria-label="Select line" defaultChecked />
          </ListItemSelect>
          <ListItemLink href="#line-1">
            <ListItemBody>
              <ListItemLabel>Line</ListItemLabel>
            </ListItemBody>
          </ListItemLink>
        </ListItem>
      </ul>,
    );
    const checkbox = document.querySelector<HTMLElement>(
      'input[type="checkbox"], [role="checkbox"]',
    )!;
    const link = document.querySelector<HTMLAnchorElement>('a')!;
    const row = document.querySelector<HTMLElement>('[data-ui="list-item"]')!;
    const select = row.querySelector<HTMLElement>('[data-part="select"]')!;

    expect(link.contains(checkbox)).toBe(false);
    expect(checkbox.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await userEvent.tab();
    expect(document.activeElement).toBe(checkbox);
    await userEvent.tab();
    expect(document.activeElement).toBe(link);

    const rowStart = row.getBoundingClientRect().left;
    const inset = parseFloat(getComputedStyle(select).paddingLeft);

    expect(select.getBoundingClientRect().left).toBeCloseTo(rowStart, 0);
    expect(checkbox.getBoundingClientRect().left).toBeCloseTo(rowStart + inset, 0);
    expect(link.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      select.getBoundingClientRect().right,
    );

    const label = row.querySelector<HTMLElement>('[data-part="label"]')!.getBoundingClientRect();
    const box = checkbox.getBoundingClientRect();

    expect(box.top + box.height / 2).toBeCloseTo(label.top + label.height / 2, 0);
  });
});
