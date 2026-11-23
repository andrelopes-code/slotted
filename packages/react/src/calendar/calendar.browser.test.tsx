import { plainDate } from '@slotted/core/date';
import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

import { Dialog, DialogBody, DialogContent, DialogTitle } from '../dialog';

import { Calendar, CalendarDayMark, CalendarDayMarks, CalendarDayValue } from './index';

describe('a month with content in its days', () => {
  it('draws the marks and the figure of a day, names it, and fills its column', () => {
    const { container } = render(
      <div style={{ inlineSize: 480 }}>
        <Calendar
          dayLabel={(date) =>
            date.day === 20 ? 'October 20; 2 items, 1 open' : `October ${String(date.day)}`
          }
          defaultFocusedDate={plainDate(2026, 10, 1)}
          layout="fill"
          renderDay={(date) =>
            date.day === 20 && date.month === 10 ? (
              <>
                <CalendarDayMarks>
                  <CalendarDayMark tone="data-1" />
                  <CalendarDayMark hollow tone="data-2" />
                </CalendarDayMarks>
                <CalendarDayValue>−220</CalendarDayValue>
              </>
            ) : null
          }
        />
      </div>,
    );
    const day = screen.getByRole('button', { name: 'October 20; 2 items, 1 open' });
    const marks = [...day.querySelectorAll<HTMLElement>('[data-part="day-mark"]')];
    const value = day.querySelector<HTMLElement>('[data-part="day-value"]')!;
    const header = container.querySelector('[data-part="week-header"]')!;

    expect(marks.map((mark) => mark.dataset['tone'])).toEqual(['data-1', 'data-2']);
    expect(marks[1]!.hasAttribute('data-hollow')).toBe(true);
    expect(getComputedStyle(marks[1]!).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(value.textContent).toBe('−220');
    expect(value.getBoundingClientRect().height).toBeLessThan(20);
    expect(header.getBoundingClientRect().width).toBeCloseTo(480 / 7, 0);
  });
});

/* A page that has a month control of its own repeats the name and the arrows of the header. */
describe('a month without its header', () => {
  it('leaves no heading and no control in the document, and names its grid', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={plainDate(2026, 10, 1)} header={false} locale="en-US" />,
    );

    expect(container.querySelector('[data-part="header"]')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('button', { name: /month|October/i })).toBeNull();
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeTruthy();
  });
});

/* The focus is on the day, so a tooltip placed inside its content answers the pointer alone. */
describe('the tooltip of a day', () => {
  function Month() {
    return (
      <Calendar
        aria-label="October"
        defaultFocusedDate={plainDate(2026, 10, 20)}
        header={false}
        layout="fill"
        renderDayTooltip={(date, state) =>
          date.month === 10 && (date.day === 20 || date.day === 22)
            ? `${String(date.day)}: 2 items${state.selected ? ', chosen' : ''}`
            : null
        }
      />
    );
  }

  const day = (name: string) =>
    screen
      .getAllByRole('button', { name })
      .find((button) => button.closest('td:not([data-outside-month])') !== null)!;
  const tooltip = () => document.querySelector('[role="tooltip"]');

  it('opens as the day takes the keyboard focus, and follows it', async () => {
    render(<Month />);

    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(day('20'));
    await expect.poll(() => tooltip()?.textContent).toBe('20: 2 items');
    expect(day('20').getAttribute('aria-describedby')).toBe(tooltip()!.id);

    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(tooltip).toBeNull();

    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => tooltip()?.textContent).toBe('22: 2 items');

    await userEvent.keyboard('{Escape}');
    await expect.poll(tooltip).toBeNull();
  });

  it('opens under the pointer, and the press still chooses the day', async () => {
    render(<Month />);

    await userEvent.hover(day('22'));
    await expect.poll(() => tooltip()?.textContent, { timeout: 2000 }).toBe('22: 2 items');

    await userEvent.click(day('22'));
    expect(day('22').getAttribute('aria-selected')).toBe('true');
    await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 900 });
  });

  it('opens inside a dialog, and Escape closes it before the dialog', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Schedule</DialogTitle>
          <DialogBody>
            <Month />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await expect.poll(() => screen.queryByRole('dialog')).not.toBeNull();

    await expect.poll(() => document.activeElement).toBe(day('20'));
    await userEvent.keyboard('{ArrowRight}{ArrowLeft}');
    await expect.poll(() => tooltip()?.textContent).toBe('20: 2 items');

    await userEvent.keyboard('{Escape}');
    await expect.poll(tooltip).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });
});

/* A filled month with no lines reads as numbers on a plane. */
describe('the lines of a filled month', () => {
  it('stand between the days and not around them', () => {
    const { container } = render(
      <div style={{ inlineSize: 480 }}>
        <Calendar
          defaultFocusedDate={plainDate(2026, 10, 1)}
          layout="fill"
          lines
          style={{ '--slotted-calendar-line-color': 'rgb(1, 2, 3)' } as CSSProperties}
        />
      </div>,
    );
    const weeks = [...container.querySelectorAll('[data-part="week"]')].map((week) =>
      [...week.querySelectorAll('[data-part="cell"]')].map((cell) => getComputedStyle(cell)),
    );

    expect(weeks[1]![1]!.borderTopWidth).toBe('1px');
    expect(weeks[1]![1]!.borderTopColor).toBe('rgb(1, 2, 3)');
    expect(weeks[1]![1]!.borderLeftWidth).toBe('1px');
    expect(weeks[0]![0]!.borderTopWidth).toBe('0px');
    expect(weeks[0]![0]!.borderLeftWidth).toBe('0px');
    expect(weeks.at(-1)!.at(-1)!.borderBottomWidth).toBe('0px');
    expect(weeks.at(-1)!.at(-1)!.borderRightWidth).toBe('0px');
  });
});
