import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { MenuItem } from '../menu';
import {
  ActionBar,
  ActionBarAction,
  ActionBarActions,
  ActionBarOverflow,
  ActionBarStatus,
} from './index';

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

/** The status took all the free room, so the margins that place the run had none left. */
describe('the align of an action bar beside a status', () => {
  function placed(align: 'start' | 'center' | 'end') {
    const { container } = render(
      <div style={{ inlineSize: 1148 }}>
        <ActionBar align={align} aria-label="Selected records">
          <ActionBarStatus>
            <span>3 selected</span>
          </ActionBarStatus>
          <ActionBarActions>
            <ActionBarAction>
              <Button variant="outline">Archive</Button>
            </ActionBarAction>
            <ActionBarAction>
              <Button variant="ghost">Clear</Button>
            </ActionBarAction>
          </ActionBarActions>
        </ActionBar>
      </div>,
    );
    const bar = container.querySelector<HTMLElement>('[data-ui="action-bar"]')!;
    const style = getComputedStyle(bar);
    const text = bar.querySelector('[data-part="status"] > span')!.getBoundingClientRect();

    return {
      actions: bar.querySelector('[data-part="actions"]')!.getBoundingClientRect(),
      end: bar.getBoundingClientRect().right - parseFloat(style.paddingRight),
      gap: parseFloat(style.columnGap),
      text,
    };
  }

  it('starts the run one gap after the status', () => {
    const { actions, gap, text } = placed('start');

    expect(Math.abs(actions.left - text.right - gap)).toBeLessThanOrEqual(1);
  });

  it('centers the run in the room left after the status', () => {
    const { actions, end, gap, text } = placed('center');

    expect(Math.abs(actions.left - (text.right + gap) - (end - actions.right))).toBeLessThanOrEqual(
      1,
    );
  });

  it('keeps the run against the end edge', () => {
    const { actions, end } = placed('end');

    expect(Math.abs(actions.right - end)).toBeLessThanOrEqual(1);
  });
});
