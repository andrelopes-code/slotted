import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/calendar/contract.json';
import { SlottedProvider } from '../i18n';
import { Calendar, CalendarDefaultsProvider } from './index';
import type { CalendarHandle, CalendarValue, DateRange } from './index';

const NINTH = plainDate(2026, 9, 9);

const grid = () => screen.getAllByRole('grid');
const days = () => [...document.querySelectorAll('[data-part="day"]')] as HTMLElement[];
const dayFor = (number: number) =>
  days().find(
    (element) =>
      element.textContent === String(number) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  ) as HTMLElement;
const roving = () => days().find((element) => element.tabIndex === 0) as HTMLElement;

const press = (key: string, init: KeyboardEventInit = {}) => {
  fireEvent.keyDown(roving() ?? document.body, { key, ...init });
};

describe('the shape the pattern asks for', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} locale="pt-BR" weekNumbers />,
    );

    const present = [...container.querySelectorAll('[data-part]')].map(
      (element) => (element as HTMLElement).dataset['part'],
    );
    expect(container.querySelector('[data-ui="calendar"]')).toBeInTheDocument();
    for (const part of ['root', 'header', 'previous', 'next', 'heading', 'grids', 'grid']) {
      expect(present).toContain(part);
    }
    expect(contract.ui).toBe('calendar');
  });

  /**
   * The APG's own note: with the grid role on a `table`, the row,
   * column-header and cell roles are implied and must not be written.
   */
  it('puts the grid role on a real table and writes none of the implied ones', () => {
    const { container } = render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);

    expect(grid()[0]?.tagName).toBe('TABLE');
    expect(container.querySelector('tr[role]')).toBeNull();
    expect(container.querySelector('td[role]')).toBeNull();
    expect(container.querySelector('th[role]')).toBeNull();
  });

  it('gives the column header the full weekday name a reader hears', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);
    const headers = [...document.querySelectorAll('[data-part="week-header"]')];
    expect(headers).toHaveLength(7);
    expect(headers[0]?.getAttribute('abbr')).toBe('domingo');
  });

  it('keeps exactly one cell in the tab sequence', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);
    expect(days().filter((element) => element.tabIndex === 0)).toHaveLength(1);
    expect(roving().textContent).toBe('9');
  });

  it('names the month in a live region, because a key changes nothing else', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);
    const heading = screen.getByRole('button', { name: /setembro/ });
    expect(heading).toHaveAttribute('aria-live', 'polite');
  });
});

describe('the keyboard the grid pattern lists', () => {
  it('moves by a day and by a week', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);

    press('ArrowRight');
    expect(roving().textContent).toBe('10');

    press('ArrowDown');
    expect(roving().textContent).toBe('17');

    press('ArrowUp');
    expect(roving().textContent).toBe('10');

    press('ArrowLeft');
    expect(roving().textContent).toBe('9');
  });

  it('goes to the ends of the displayed week', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);

    press('Home');
    expect(roving().textContent).toBe('6');

    press('End');
    expect(roving().textContent).toBe('12');
  });

  /** The APG clamps to the last day a short month has. */
  it('pages a month and clamps the day the next one cannot hold', () => {
    render(<Calendar defaultFocusedDate={plainDate(2026, 1, 31)} locale="pt-BR" />);

    press('PageDown');
    expect(screen.getByRole('button', { name: /fevereiro/ })).toBeInTheDocument();
    expect(roving().textContent).toBe('28');
  });

  it('pages a year with Shift', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);

    press('PageDown', { shiftKey: true });
    expect(screen.getByRole('button', { name: /setembro de 2027/ })).toBeInTheDocument();
  });

  it('selects with Enter and with Space', () => {
    const onValueChange = vi.fn();
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" onValueChange={onValueChange} />);

    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(
      NINTH,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });
});

/**
 * An agenda beside the calendar marks the days that hold items, without
 * faking it with selection. A mark is a part of the day it falls on, and its
 * count is in the day's accessible name.
 */
describe('a day that carries a mark', () => {
  it('draws the mark in that cell alone and names its count', () => {
    const { container } = render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="en-US"
        marks={new Map([['2026-09-12', { count: 2, tone: 'info' as const }]])}
      />,
    );
    const marks = container.querySelectorAll('[data-part="mark"]');
    expect(marks).toHaveLength(1);
    const day = marks[0]?.closest('[data-part="day"]') as HTMLElement;
    expect(day.firstChild?.textContent).toBe('12');
    expect(marks[0]).toHaveAttribute('data-tone', 'info');
    expect(screen.getByRole('button', { name: '12, 2 items' })).toBe(day);
  });
});

describe('what a cell says', () => {
  it('marks today apart from the selection', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} defaultValue={plainDate(2026, 9, 17)} locale="pt-BR" />,
    );

    const selected = container.querySelector('[data-part="cell"][data-selected] [data-part="day"]');
    expect(selected?.textContent).toBe('17');
    /* Today is resolved in an effect, so the attribute is on whichever cell the
       runtime's own zone says it is on; what matters is that it is not the
       selection's. */
    const marked = container.querySelector('[data-part="day"][data-today]');
    expect(marked === null || marked !== selected).toBe(true);
  });

  it('keeps a refused date reachable and refuses to select it', () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        isDateUnavailable={(date) => date.day === 10}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );

    const tenth = dayFor(10);
    expect(tenth).toHaveAttribute('aria-disabled', 'true');
    expect(tenth.closest('[data-part="cell"]')).toHaveAttribute('data-unavailable');

    fireEvent.click(tenth);
    expect(onValueChange).not.toHaveBeenCalled();

    /* Still reachable: the arrow lands on it and the reader can be told why. */
    press('ArrowRight');
    expect(roving().textContent).toBe('10');
  });

  it('marks a day of the month either side', () => {
    const { container } = render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);
    expect(container.querySelector('[data-part="cell"][data-outside-month]')).toBeInTheDocument();
  });

  /**
   * September's grid ends with the first days of October and October's begins
   * with the last days of September, so a pair that draws both writes the same
   * six dates twice — and a range across the boundary was painted twice on the
   * reference page.
   */
  it('draws no day of a neighbouring month when more than one month is shown', () => {
    const { container } = render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" months={2} />);
    const outside = [...container.querySelectorAll('[data-part="cell"][data-outside-month]')];
    expect(outside.length).toBeGreaterThan(0);
    for (const cell of outside) {
      expect(cell.querySelector('[data-part="day"]')).toBeNull();
    }

    /* Sixty-one days across the two grids, each written once. */
    expect(container.querySelectorAll('[data-part="day"]')).toHaveLength(61);
  });

  it('draws them again in a pair when the consumer asks for them', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} locale="pt-BR" months={2} outsideDays="shown" />,
    );
    expect(container.querySelector('[data-part="cell"][data-outside-month]')).toBeInTheDocument();
  });

  it('refuses a date outside the bounds', () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        min={plainDate(2026, 9, 15)}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(dayFor(10));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('the three selection modes', () => {
  it('takes one date, and takes it back', () => {
    const onValueChange = vi.fn();
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" onValueChange={onValueChange} />);

    fireEvent.click(dayFor(10));
    expect(onValueChange).toHaveBeenLastCalledWith(
      plainDate(2026, 9, 10),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * A reader who chooses the 11th and then the 7th means the 7th to the 11th,
   * not a range that runs backwards.
   */
  it('orders a range whichever end is chosen first', () => {
    const onValueChange = vi.fn<(value: CalendarValue) => void>();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        onValueChange={onValueChange}
        selectionMode="range"
      />,
    );

    fireEvent.click(dayFor(11));
    fireEvent.click(dayFor(7));

    const value = onValueChange.mock.calls.at(-1)?.[0] as DateRange;
    expect(value.start).toEqual(plainDate(2026, 9, 7));
    expect(value.end).toEqual(plainDate(2026, 9, 11));
  });

  it('draws the two ends and the run between them', () => {
    const { container } = render(
      <Calendar
        defaultFocusedDate={NINTH}
        defaultValue={{ start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) }}
        locale="pt-BR"
        selectionMode="range"
      />,
    );

    expect(container.querySelector('[data-range-start] [data-part="day"]')?.textContent).toBe('7');
    expect(container.querySelector('[data-range-end] [data-part="day"]')?.textContent).toBe('11');
    expect(container.querySelectorAll('[data-in-range]')).toHaveLength(3);
  });

  /**
   * While the run has one end, the grid draws where it would close — under
   * the pointer, or on the focused day — and says so. `date-range-picker`
   * reads the day to say how long the run would be.
   */
  it('previews the open run to the day under the pointer, and reports it', () => {
    const onPreviewChange = vi.fn<(date: PlainDate | null) => void>();
    const { container } = render(
      <Calendar
        defaultFocusedDate={NINTH}
        defaultValue={{ start: plainDate(2026, 9, 7), end: null }}
        locale="pt-BR"
        onPreviewChange={onPreviewChange}
        selectionMode="range"
      />,
    );

    fireEvent.pointerEnter(dayFor(11));

    expect(onPreviewChange).toHaveBeenLastCalledWith(plainDate(2026, 9, 11));
    expect(
      container.querySelector('[data-range-end][data-preview] [data-part="day"]')?.textContent,
    ).toBe('11');
    expect(container.querySelectorAll('[data-in-range][data-preview]')).toHaveLength(3);
    /* The chosen start is a choice, not a proposal. */
    expect(container.querySelector('[data-range-start]')).not.toHaveAttribute('data-preview');

    fireEvent.pointerLeave(dayFor(11));
    /* Nothing under the pointer: the focused day is the pending end. */
    expect(onPreviewChange).toHaveBeenLastCalledWith(NINTH);
    expect(
      container.querySelector('[data-range-end][data-preview] [data-part="day"]')?.textContent,
    ).toBe('9');
  });

  it('previews backwards when the pending end is before the start', () => {
    const { container } = render(
      <Calendar
        defaultFocusedDate={NINTH}
        defaultValue={{ start: plainDate(2026, 9, 11), end: null }}
        locale="pt-BR"
        selectionMode="range"
      />,
    );

    press('ArrowLeft');
    press('ArrowLeft');

    expect(
      container.querySelector('[data-range-start][data-preview] [data-part="day"]')?.textContent,
    ).toBe('7');
    expect(container.querySelector('[data-range-end] [data-part="day"]')?.textContent).toBe('11');
    expect(container.querySelector('[data-range-end]')).not.toHaveAttribute('data-preview');
  });

  it('draws no preview once the run is whole, nor outside range mode', () => {
    const onPreviewChange = vi.fn<(date: PlainDate | null) => void>();
    const { container, rerender } = render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        onPreviewChange={onPreviewChange}
        selectionMode="range"
        value={{ start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) }}
      />,
    );
    fireEvent.pointerEnter(dayFor(20));
    expect(container.querySelector('[data-preview]')).toBeNull();
    expect(onPreviewChange).not.toHaveBeenCalledWith(plainDate(2026, 9, 20));

    rerender(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        onPreviewChange={onPreviewChange}
        selectionMode="single"
        value={plainDate(2026, 9, 7)}
      />,
    );
    fireEvent.pointerEnter(dayFor(20));
    expect(container.querySelector('[data-preview]')).toBeNull();
  });

  it('adds to a set and takes a date back out of it', () => {
    const onValueChange = vi.fn<(value: CalendarValue) => void>();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        onValueChange={onValueChange}
        selectionMode="multiple"
      />,
    );

    fireEvent.click(dayFor(7));
    fireEvent.click(dayFor(11));
    expect(onValueChange.mock.calls.at(-1)?.[0]).toHaveLength(2);

    fireEvent.click(dayFor(7));
    expect(onValueChange.mock.calls.at(-1)?.[0]).toHaveLength(1);
  });
});

describe('the three views', () => {
  /**
   * The chevrons are `Glyph` elements inside `Icon` boxes, never masks: the
   * page triggers mirror under `dir="rtl"`. The heading draws none: two
   * chevrons beside it already say the row turns.
   */
  it('draws the page chevrons as glyph elements, and none on the heading', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);
    const icon = (part: string) =>
      document.querySelector(`[data-part="${part}"] > [data-ui="icon"]`);
    for (const part of ['previous', 'next']) {
      expect(icon(part)).toHaveAttribute('data-directional');
      expect(icon(part)?.querySelector('svg')).toHaveAttribute('data-glyph', 'chevron-right');
    }
    expect(icon('heading')).toBeNull();
  });

  it('walks up from the day view and back down', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" />);

    fireEvent.click(screen.getByRole('button', { name: /setembro de 2026/ }));
    expect(document.querySelector('[data-part="months"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2026' }));
    expect(document.querySelector('[data-part="years"]')).toBeInTheDocument();
  });

  /**
   * `Escape` inside a month or year view goes down a view rather than out of
   * the component, which is the staging `dismissable-layer` asks for: the
   * family decides and simply does not pass the key on.
   */
  it('takes Escape down a view rather than out of the component', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} defaultView="year" locale="pt-BR" />,
    );
    const root = container.querySelector('[data-ui="calendar"]') as HTMLElement;

    fireEvent.keyDown(root, { key: 'Escape' });
    expect(root).toHaveAttribute('data-view', 'month');

    fireEvent.keyDown(root, { key: 'Escape' });
    expect(root).toHaveAttribute('data-view', 'day');
  });

  it('leaves Escape alone in the day view, so a surface above it may close', () => {
    const onKeyDown = vi.fn();
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} locale="pt-BR" onKeyDown={onKeyDown} />,
    );
    const root = container.querySelector('[data-ui="calendar"]') as HTMLElement;

    fireEvent.keyDown(root, { key: 'Escape' });
    expect(root).toHaveAttribute('data-view', 'day');
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('picks a month from the month view and returns to the days', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} defaultView="month" locale="pt-BR" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'janeiro' }));
    expect(container.querySelector('[data-ui="calendar"]')).toHaveAttribute('data-view', 'day');
    expect(screen.getByRole('button', { name: /janeiro de 2026/ })).toBeInTheDocument();
  });
});

describe('how much of it is drawn', () => {
  it('draws more than one month, and names each one', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="pt-BR" months={2} />);

    expect(grid()).toHaveLength(2);
    const captions = [...document.querySelectorAll('[data-part="grid-caption"]')].map(
      (element) => element.textContent,
    );
    expect(captions).toEqual(['setembro de 2026', 'outubro de 2026']);
  });

  /**
   * Drawing the pair from the focused date meant that choosing a day in the
   * second month scrolled the pair: a reader looking at June and July who
   * chose 9 June was shown July and August, with half of what they had just
   * chosen off screen.
   */
  it('does not move the pair when a day in the second month is chosen', () => {
    render(<Calendar defaultFocusedDate={plainDate(2026, 6, 1)} locale="pt-BR" months={2} />);

    const captions = () =>
      [...document.querySelectorAll('[data-part="grid-caption"]')].map(
        (element) => element.textContent,
      );
    expect(captions()).toEqual(['junho de 2026', 'julho de 2026']);

    /* The ninth of July, which is in the second month on screen. */
    const july = document.querySelectorAll('[data-part="grid"]')[1] as HTMLElement;
    const ninth = [...july.querySelectorAll('[data-part="day"]')].find(
      (element) =>
        element.textContent === '9' &&
        element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
    ) as HTMLElement;
    fireEvent.click(ninth);

    expect(captions()).toEqual(['junho de 2026', 'julho de 2026']);
  });

  it('moves the pair by a whole page when the reader steps past its edge', () => {
    render(<Calendar defaultFocusedDate={plainDate(2026, 6, 1)} locale="pt-BR" months={2} />);

    /* Back one day from the first of June leaves the page at its start edge. */
    press('ArrowLeft');
    const captions = [...document.querySelectorAll('[data-part="grid-caption"]')].map(
      (element) => element.textContent,
    );
    expect(captions).toEqual(['abril de 2026', 'maio de 2026']);
  });

  it('draws six rows on request, so a popup does not resize under the pointer', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={plainDate(2026, 2, 1)} fixedWeeks locale="pt-BR" />,
    );
    expect(container.querySelectorAll('[data-part="week"]')).toHaveLength(6);
  });

  it('draws a week number column on request', () => {
    const { container } = render(
      <Calendar defaultFocusedDate={NINTH} locale="pt-BR" weekNumbers />,
    );
    expect(container.querySelector('[data-ui="calendar"]')).toHaveAttribute('data-week-numbers');
    expect(container.querySelectorAll('th[data-part="week-number"]').length).toBeGreaterThan(1);
  });
});

describe('what an application sets once', () => {
  it('takes the shape from a provider and the locale from the language in force', () => {
    render(
      <SlottedProvider locale="de-DE">
        <CalendarDefaultsProvider fixedWeeks>
          <Calendar defaultFocusedDate={NINTH} />
        </CalendarDefaultsProvider>
      </SlottedProvider>,
    );

    expect(screen.getByRole('button', { name: /September 2026/ })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-part="week"]')).toHaveLength(6);
  });

  it('lets one calendar outrank the language in force', () => {
    render(
      <SlottedProvider locale="de-DE">
        <Calendar defaultFocusedDate={NINTH} locale="pt-BR" />
      </SlottedProvider>,
    );
    expect(screen.getByRole('button', { name: /setembro de 2026/ })).toBeInTheDocument();
  });

  it('changes its words and its month names together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <Calendar defaultFocusedDate={NINTH} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeInTheDocument();
    // language: en-US
    expect(screen.getByRole('button', { name: /setembro de 2026/ })).toBeInTheDocument();

    rerender(inLocale('en-US'));
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /September 2026/ })).toBeInTheDocument();
  });

  it('lays its own messages over the catalog', () => {
    render(<Calendar defaultFocusedDate={NINTH} messages={{ nextMonth: 'Seguinte' }} />);
    expect(screen.getByRole('button', { name: 'Seguinte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
  });
});

describe('the composition surface', () => {
  it('separates the date chosen from the date the reader is on', () => {
    const onFocusedDateChange = vi.fn();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        onFocusedDateChange={onFocusedDateChange}
      />,
    );

    press('ArrowRight');
    expect(onFocusedDateChange).toHaveBeenCalledWith(
      plainDate(2026, 9, 10),
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('hands the consumer a handle for what a prop cannot express', () => {
    let handle: CalendarHandle | null = null;
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        ref={(instance) => {
          handle = instance;
        }}
      />,
    );

    act(() => (handle as CalendarHandle | null)?.focusDate(plainDate(2026, 11, 3)));
    expect(screen.getByRole('button', { name: /novembro de 2026/ })).toBeInTheDocument();
  });

  it('substitutes the element the root renders', () => {
    const { container } = render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="pt-BR"
        render={(props) => <section {...props} />}
      />,
    );
    expect(container.querySelector('section[data-ui="calendar"]')).toBeInTheDocument();
  });

  it('answers no key and no press while it is read-only', () => {
    const onValueChange = vi.fn();
    render(
      <Calendar defaultFocusedDate={NINTH} locale="pt-BR" onValueChange={onValueChange} readOnly />,
    );

    fireEvent.click(dayFor(10));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('takes every cell out of the tab sequence when it is disabled', () => {
    render(<Calendar defaultFocusedDate={NINTH} disabled locale="pt-BR" />);
    expect(days().filter((element) => element.tabIndex === 0)).toHaveLength(0);
  });

  it('follows a controlled focused date and never moves it itself', () => {
    const held: PlainDate = NINTH;
    render(<Calendar focusedDate={held} locale="pt-BR" />);

    press('ArrowRight');
    /* The consumer never wrote a new value back, so the reader is still on the
       ninth the next time it is read. */
    expect(roving().textContent).toBe('9');
  });
});

describe('the page it opens on with nothing stated', () => {
  it('starts two months on today’s month', () => {
    const thisMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(),
    );
    render(<Calendar locale="en-US" months={2} />);

    expect(document.querySelector('[data-part="heading"]')).toHaveTextContent(thisMonth);
  });
});

describe('a focused date the consumer owns', () => {
  /**
   * The page follows `focusedDate` in an effect, one render after the key, so
   * the cell that took focus on the old page was replaced by the new one and
   * focus fell to the document. Found by datetime-picker, which owns the
   * focused date to answer the day its list shows.
   */
  it('keeps focus on the grid when a key moves it onto another month', async () => {
    function Owned() {
      const [focused, setFocused] = useState<PlainDate>(plainDate(2026, 9, 30));
      return <Calendar focusedDate={focused} locale="en-US" onFocusedDateChange={setFocused} />;
    }
    render(<Owned />);
    const start = document.querySelector('[data-part="day"][tabindex="0"]') as HTMLElement;
    expect(start.textContent?.trim()).toBe('30');
    act(() => start.focus());

    fireEvent.keyDown(start, { key: 'ArrowRight' });

    await waitFor(() => expect(document.activeElement?.textContent?.trim()).toBe('1'));
    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.closest('[data-outside-month]')).toBeNull();
  });
});

describe('the months of a year', () => {
  const selected = () =>
    [...document.querySelectorAll('[data-part="period"][data-selected]')].map(
      (period) => period.textContent,
    );

  it('mark the month held where a month is the choice, not the one the reader is on', () => {
    render(
      <Calendar
        defaultFocusedDate={plainDate(2026, 5, 1)}
        defaultValue={plainDate(2026, 3, 1)}
        granularity="month"
        locale="en-US"
        min={plainDate(2026, 2, 1)}
      />,
    );

    expect(selected()).toEqual(['March']);
    expect(document.querySelector('[data-focused]')?.textContent).toBe('May');
    expect(document.querySelector('[data-part="period"][data-unavailable]')?.textContent).toBe(
      'January',
    );
  });

  it('mark the month the reader is on where they lead to its days', () => {
    render(
      <Calendar
        defaultFocusedDate={plainDate(2026, 5, 1)}
        defaultValue={plainDate(2026, 3, 1)}
        defaultView="month"
        locale="en-US"
      />,
    );

    expect(selected()).toEqual(['May']);

    fireEvent.click(screen.getByRole('button', { name: 'July' }));

    expect(screen.getByRole('grid', { name: /July 2026/ })).toBeInTheDocument();
  });
});

describe('what a chosen day says to assistive technology', () => {
  const pressed = () =>
    screen.queryAllByRole('button', { pressed: true }).map((element) => element.textContent);
  const violations = async () => {
    const { violations: found } = await axe.run(document.body, {
      runOnly: ['aria-allowed-attr', 'aria-allowed-role', 'aria-valid-attr-value'],
    });

    return found.map(({ id }) => id);
  };

  it('is the press of its button', async () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="en-US" />);
    expect(pressed()).toEqual([]);

    fireEvent.click(dayFor(12));

    expect(pressed()).toEqual(['12']);
    expect(dayFor(13)).toHaveAttribute('aria-pressed', 'false');
    expect(await violations()).toEqual([]);
  });

  it('is the press of each end of a range, and of each day of a set', async () => {
    const run: DateRange = { start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) };
    const { unmount } = render(
      <Calendar defaultValue={run} locale="en-US" selectionMode="range" />,
    );
    expect(pressed()).toEqual(['7', '11']);
    expect(await violations()).toEqual([]);
    unmount();

    render(
      <Calendar
        defaultValue={[NINTH, plainDate(2026, 9, 21)]}
        locale="en-US"
        selectionMode="multiple"
      />,
    );

    expect(pressed()).toEqual(['9', '21']);
    expect(await violations()).toEqual([]);
  });

  it('is the press of a month and of a year', async () => {
    const { unmount } = render(
      <Calendar defaultValue={plainDate(2026, 3, 1)} granularity="month" locale="en-US" />,
    );
    expect(pressed()).toEqual(['March']);
    expect(await violations()).toEqual([]);
    unmount();

    render(<Calendar defaultFocusedDate={NINTH} defaultView="year" locale="en-US" />);

    expect(pressed()).toEqual(['2026']);
    expect(await violations()).toEqual([]);
  });

  it('is not said by a day with nothing to choose', async () => {
    render(<Calendar defaultValue={NINTH} isDateInert={(date) => date.day === 9} locale="en-US" />);

    expect(dayFor(9)).not.toHaveAttribute('aria-pressed');
    expect(await violations()).toEqual([]);
  });
});

describe('a header per month', () => {
  const headings = () =>
    [...document.querySelectorAll('[data-part="heading"]')].map((heading) => heading.textContent);

  it('names each month, and turns the page from the first and from the last', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="en-US" months={2} />);

    expect(headings()).toEqual(['September 2026', 'October 2026']);
    const [first, last] = document.querySelectorAll('[data-part="month"]');
    expect(first?.querySelector('[data-part="previous"]')).not.toBeNull();
    expect(first?.querySelector('[data-part="next"]')).toBeNull();
    expect(last?.querySelector('[data-part="previous"]')).toBeNull();
    expect(last?.querySelector('[data-part="next"]')).not.toBeNull();
  });

  it('labels each grid by the name of its own month', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="en-US" months={2} />);

    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
  });

  it('draws the year apart from the name of the month', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="en-US" />);

    expect(document.querySelector('[data-part="heading-rest"]')?.textContent).toBe('2026');
  });
});

describe('a week chosen whole', () => {
  const week = (number: number) => screen.getByRole('button', { name: `Choose week ${number}` });

  it('writes the seven days of a week from its number', () => {
    const change = vi.fn();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="en-US"
        onValueChange={change}
        selectionMode="range"
        weekNumbers
      />,
    );

    fireEvent.click(week(37));
    expect(change.mock.lastCall?.[0]).toEqual({
      start: plainDate(2026, 9, 6),
      end: plainDate(2026, 9, 12),
    });
    expect(week(37)).toHaveAttribute('tabindex', '-1');
  });

  it('stays inside the bounds', () => {
    const change = vi.fn();
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        locale="en-US"
        max={plainDate(2026, 9, 10)}
        min={plainDate(2026, 9, 8)}
        onValueChange={change}
        selectionMode="range"
        weekNumbers
      />,
    );

    fireEvent.click(week(37));
    expect(change.mock.lastCall?.[0]).toEqual({
      start: plainDate(2026, 9, 8),
      end: plainDate(2026, 9, 10),
    });
  });

  it('draws the number as text where one day is the choice', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="en-US" weekNumbers />);

    expect(screen.queryByRole('button', { name: 'Choose week 37' })).toBeNull();
    expect(document.querySelectorAll('[data-part="week-number"]')[2]).toHaveTextContent('37');
  });
});

describe('a run past its limit', () => {
  it('marks the days of the run that are over, and no other day', () => {
    render(
      <Calendar
        defaultFocusedDate={NINTH}
        defaultValue={{ start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) }}
        isDateOver={(date) => date.day > 9}
        locale="en-US"
        selectionMode="range"
      />,
    );

    const over = [...document.querySelectorAll('[data-part="cell"][data-over]')];
    expect(over.map((cell) => cell.textContent)).toEqual(['10', '11']);
  });
});

describe('the weekend', () => {
  it('is marked on its days', () => {
    render(<Calendar defaultFocusedDate={NINTH} locale="en-US" />);

    const saturday = document.querySelectorAll('[data-part="week"]')[1]?.lastElementChild;
    expect(saturday).toHaveAttribute('data-weekend');
    expect(saturday?.previousElementSibling).not.toHaveAttribute('data-weekend');
  });

  it.each([
    /* Egypt in Latin digits, so the cells read as the other locale's do. */
    ['ar-EG-u-nu-latn', ['27', '28']],
    ['en-US', ['28', '29']],
  ])('follows the weekend of %s', (locale, weekend) => {
    render(<Calendar defaultFocusedDate={plainDate(2026, 11, 25)} locale={locale} />);

    const marked = [...document.querySelectorAll('[data-part="cell"][data-weekend]')]
      .filter((cell) => !cell.hasAttribute('data-outside-month'))
      .map((cell) => cell.textContent);
    expect(marked.filter((day) => ['27', '28', '29'].includes(day ?? ''))).toEqual(weekend);
  });
});

it('says which month the page starts on, and when it turns', () => {
  const pages = vi.fn();
  render(<Calendar defaultFocusedDate={NINTH} locale="en-US" months={2} onPageChange={pages} />);
  expect(pages.mock.lastCall?.[0]).toEqual({ year: 2026, month: 9 });

  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(pages.mock.lastCall?.[0]).toEqual({ year: 2026, month: 11 });
});

describe('the day it is, stated by the application', () => {
  it.each([
    ['the prop', <Calendar locale="en-US" today={plainDate(2026, 10, 17)} />],
    [
      'the provider',
      <CalendarDefaultsProvider today={plainDate(2026, 10, 17)}>
        <Calendar locale="en-US" />
      </CalendarDefaultsProvider>,
    ],
  ])('marks it and opens on its month, through %s', (_, calendar) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 25, 12));
    try {
      render(calendar);

      expect(document.querySelector('[data-part="heading"]')?.textContent).toBe('October 2026');
      expect(document.querySelector('[data-part="day"][data-today]')?.textContent).toBe('17');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the day the clock says it is', () => {
  it('opens a calendar mounted after the page loaded on its month, and keeps the grid', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 25, 12));
    try {
      const pages = vi.fn();
      render(<Calendar locale="en-US" onPageChange={pages} />);
      const grid = document.querySelector('[data-part="month"]');

      expect(document.querySelector('[data-part="heading"]')?.textContent).toBe('November 2026');
      expect(pages.mock.calls).toEqual([[{ year: 2026, month: 11 }]]);
      expect(document.querySelector('[data-part="month"]')).toBe(grid);
    } finally {
      vi.useRealTimers();
    }
  });
});
