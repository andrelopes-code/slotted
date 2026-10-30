import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { MenuItem } from '../menu';
import { ActionBar, ActionBarAction, ActionBarActions, ActionBarOverflow } from './index';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * On a phone a bar with an overflow control stacked every action into a
 * column and hid the control, so the actions that declared a counterpart never
 * folded: three actions stood in a bar 164 pixels tall. With an overflow
 * control the bar keeps one row and folds what has a counterpart.
 */
describe('an action bar with an overflow control on a phone', () => {
  it('keeps one row and folds the actions that have a counterpart', async () => {
    render(
      <div style={{ inlineSize: 358 }}>
        <ActionBar>
          <ActionBarActions>
            <ActionBarAction counterpart={<MenuItem>Discard</MenuItem>}>
              <Button>Discard</Button>
            </ActionBarAction>
            <ActionBarAction counterpart={<MenuItem>Save and add another</MenuItem>}>
              <Button>Save and add another</Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button>Save</Button>
            </ActionBarAction>
            <ActionBarOverflow />
          </ActionBarActions>
        </ActionBar>
      </div>,
    );
    for (let index = 0; index < 6; index += 1) await frame();

    const actions = document.querySelector('[data-ui="action-bar"] [data-part="actions"]')!;
    const save = [...document.querySelectorAll('[data-ui="button"]')].find(
      (button) => button.textContent === 'Save',
    )!;
    expect(actions.getBoundingClientRect().height).toBeCloseTo(
      save.getBoundingClientRect().height,
      0,
    );
    const overflow = document.querySelector('[data-part="overflow"]') as HTMLElement;
    expect(overflow.hidden).toBe(false);
    expect(getComputedStyle(overflow).display).not.toBe('none');
    /* How many fold depends on the labels' width; what fits stays, the rest folds. */
    const folded = [...document.querySelectorAll('[data-part="action"]')].filter(
      (action) => (action as HTMLElement).hidden,
    );
    expect(folded.length).toBeGreaterThanOrEqual(1);
    expect(save.closest('[data-part="action"]')!.hasAttribute('hidden')).toBe(false);
    expect(actions.scrollWidth).toBeLessThanOrEqual(actions.clientWidth);
  });
});
