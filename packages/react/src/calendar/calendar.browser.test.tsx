import { addDays, plainDate, todayIn } from '@slotted/core/date';
import { render, screen, within } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

import { Dialog, DialogBody, DialogContent, DialogTitle } from '../dialog';

import {
  Calendar,
  CalendarDayMark,
  CalendarDayMarks,
  CalendarDayValue,
  type CalendarProps,
} from './index';

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

/* A month of records reads down its columns: the number, the figure, the marks. */
describe('the content of a day at its start', () => {
  it.each(['ltr', 'rtl'])('stands on the start of the first and of the last line (%s)', (dir) => {
    const { container } = renderMonth({ dayAlign: 'start', dir });
    const day = container.querySelector<HTMLElement>('[data-part="day"]')!.getBoundingClientRect();
    const box = (part: string) =>
      container.querySelector(`[data-part="day"] [data-part="${part}"]`)!.getBoundingClientRect();
    const start = (rect: DOMRect) =>
      dir === 'rtl' ? day.right - rect.right : rect.left - day.left;
    const end = (rect: DOMRect) => (dir === 'rtl' ? rect.left - day.left : day.right - rect.right);

    expect(start(box('day-number'))).toBeLessThan(6);
    expect(box('day-number').top - day.top).toBeLessThan(6);
    expect(start(box('day-mark'))).toBeLessThan(10);
    expect(day.bottom - box('day-marks').bottom).toBeLessThan(6);
    expect(end(box('day-value'))).toBeLessThan(10);
    expect(box('day-value').top).toBeGreaterThanOrEqual(box('day-number').bottom);
    expect(box('day-value').bottom).toBeLessThanOrEqual(box('day-marks').top);
  });

  it('starts the names of the weekdays on the line of the numbers', () => {
    const { container } = renderMonth({ dayAlign: 'start' });
    const header = container.querySelector('[data-part="week-header"]')!;
    const range = document.createRange();
    range.selectNodeContents(header);
    const mark = container.querySelector('[data-part="day"] [data-part="day-mark"]')!;
    const inset = (box: DOMRect, cell: Element) => box.left - cell.getBoundingClientRect().left;

    expect(header.textContent).toBe('Sun');
    expect(inset(range.getBoundingClientRect(), header)).toBeCloseTo(
      inset(mark.getBoundingClientRect(), mark.closest('td')!),
      0,
    );
  });

  it('stays in the middle unless it is asked for', () => {
    const { container } = renderMonth({});
    const day = container.querySelector('[data-part="day"]')!.getBoundingClientRect();
    const number = container.querySelector('[data-part="day-number"]')!.getBoundingClientRect();

    expect(number.left + number.width / 2).toBeCloseTo(day.left + day.width / 2, 0);
  });
});

describe('today in a disc', () => {
  const today = todayIn();
  const paint = {
    '--slotted-tone-accent-solid': 'rgb(1, 2, 3)',
    '--slotted-tone-accent-on-solid': 'rgb(250, 251, 252)',
  } as CSSProperties;

  function number(container: HTMLElement) {
    return container.querySelector('[data-today] [data-part="day-number"]')!;
  }

  it('fills a circle with the accent solid, and draws no dot', () => {
    const { container } = renderMonth({
      defaultFocusedDate: today,
      style: paint,
      todayMark: 'disc',
    });
    const disc = getComputedStyle(number(container));
    const box = number(container).getBoundingClientRect();

    expect(disc.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(disc.color).toBe('rgb(250, 251, 252)');
    expect(box.width).toBeCloseTo(box.height, 1);
    expect(getComputedStyle(container.querySelector('[data-today]')!, '::before').display).toBe(
      'none',
    );
  });

  it('stays apart from the ground of a chosen day', () => {
    const { container } = renderMonth({
      defaultFocusedDate: today,
      defaultValue: today,
      style: paint,
      todayMark: 'disc',
    });
    const disc = getComputedStyle(number(container));

    expect(disc.backgroundColor).toBe('rgb(250, 251, 252)');
    expect(disc.color).toBe('rgb(1, 2, 3)');
  });

  it('takes its ground and its ink from the tokens, chosen or not', () => {
    for (const value of [null, today]) {
      const { container, unmount } = renderMonth({
        defaultFocusedDate: today,
        defaultValue: value,
        style: {
          '--slotted-calendar-today-background': 'rgb(4, 5, 6)',
          '--slotted-calendar-today-color': 'rgb(7, 8, 9)',
        } as CSSProperties,
        todayMark: 'disc',
      });
      const disc = getComputedStyle(number(container));

      expect(disc.backgroundColor).toBe('rgb(4, 5, 6)');
      expect(disc.color).toBe('rgb(7, 8, 9)');
      unmount();
    }
  });

  it('is a dot unless it is asked for', () => {
    const { container } = renderMonth({ defaultFocusedDate: today, style: paint });

    expect(getComputedStyle(number(container)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(container.querySelector('[data-today]')!, '::before').display).not.toBe(
      'none',
    );
  });
});

/* A day with no record holds nothing to choose, which is not the same as a refused one. */
describe('a day that holds nothing to choose', () => {
  const inert = (date: { day: number }) => date.day !== 20 && date.day !== 22;

  it('is plain text: no button, no strike, no tooltip, the ink of any day', () => {
    const { container } = renderMonth({
      isDateInert: inert,
      renderDayTooltip: (date) => `tooltip ${String(date.day)}`,
    });
    const grid = within(container.querySelector('[data-part="grid"]')!);
    const days = [...container.querySelectorAll<HTMLElement>('[data-part="day"]')];
    const plain = days.find((day) => day.textContent.startsWith('12'))!;
    const pressable = days.find((day) => day.textContent.startsWith('20'))!;

    expect(grid.getAllByRole('button')).toHaveLength(2);
    expect(plain.hasAttribute('aria-disabled')).toBe(false);
    expect(plain.hasAttribute('aria-label')).toBe(false);
    expect(getComputedStyle(plain).textDecorationLine).toBe('none');
    expect(getComputedStyle(plain).color).toBe(getComputedStyle(pressable).color);
    expect(getComputedStyle(plain).cursor).toBe('default');
  });

  it('is crossed by the arrows and chosen by neither a press nor a key', async () => {
    const onValueChange = vi.fn();
    const { container } = renderMonth({
      defaultFocusedDate: plainDate(2026, 10, 20),
      isDateInert: inert,
      onValueChange,
    });
    const focused = () => document.activeElement!.textContent;

    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toMatch(/^21/);

    await userEvent.keyboard('{Enter}');
    await userEvent.click(
      [...container.querySelectorAll('[data-part="day"]')].find((day) =>
        day.textContent.startsWith('12'),
      )!,
    );
    expect(onValueChange).not.toHaveBeenCalled();

    await userEvent.click(
      [...container.querySelectorAll('[data-part="day"]')].find((day) =>
        day.textContent.startsWith('22'),
      )!,
    );
    expect(onValueChange.mock.lastCall![0]).toEqual(plainDate(2026, 10, 22));
  });

  it('may stand inside a run, and takes precedence over a refused date', () => {
    const { container } = renderMonth({
      defaultValue: {
        start: plainDate(2026, 10, 20),
        end: addDays(plainDate(2026, 10, 20), 2),
      },
      isDateInert: inert,
      isDateUnavailable: (date) => date.day === 21,
      selectionMode: 'range',
    });
    const cell = container.querySelector('[data-in-range]')!;

    expect(cell.textContent).toMatch(/^21/);
    expect(cell.hasAttribute('data-unavailable')).toBe(false);
    expect(within(cell as HTMLElement).queryByRole('button')).toBeNull();
  });
});

function renderMonth({ dir, ...props }: CalendarProps) {
  return render(
    <div dir={dir} style={{ inlineSize: 700 }}>
      <Calendar
        defaultFocusedDate={plainDate(2026, 10, 1)}
        header={false}
        layout="fill"
        locale="en-US"
        outsideDays="hidden"
        renderDay={() => (
          <>
            <CalendarDayValue>−220</CalendarDayValue>
            <CalendarDayMarks>
              <CalendarDayMark tone="data-1" />
              <CalendarDayMark hollow tone="data-2" />
            </CalendarDayMarks>
          </>
        )}
        {...props}
      />
    </div>,
  );
}
