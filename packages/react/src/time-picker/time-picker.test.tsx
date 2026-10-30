import { plainTime, toISOTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-picker/contract.json';
import { SlottedProvider } from '../i18n';
import { TimePicker, TimePickerDefaultsProvider } from './index';
import type { TimePickerHandle } from './index';

const TEN = plainTime(10, 0);
/** Stated rather than read from the clock, so every assertion below is fixed. */
const NOON = plainTime(12, 0);

const root = () =>
  document.querySelector('[data-ui="time-picker"][data-part="root"]') as HTMLElement;
const trigger = () => document.querySelector('[data-part="trigger"]') as HTMLButtonElement;
const content = () => document.querySelector('[data-part="content"]');
const optionElements = () =>
  [...document.querySelectorAll('[data-part="option"]')] as HTMLElement[];
const labels = () => optionElements().map((element) => element.textContent?.trim());
const optionFor = (label: string) =>
  optionElements().find((element) => element.textContent?.trim() === label) as HTMLElement;
const highlighted = () => document.querySelector('[data-part="option"][data-current]');
/**
 * Whether the surface is showing, rather than whether it is mounted: the layer
 * stays in the tree until its exit finishes, and nothing in jsdom finishes it.
 */
const showing = () => document.querySelector('[data-part="positioner"][data-open]') !== null;

const open = () => fireEvent.click(trigger());
const press = (key: string, target: Element | null = document.activeElement) =>
  fireEvent.keyDown(target ?? document.body, { key });

const base = {
  locale: 'pt-BR',
  max: plainTime(11, 0),
  min: plainTime(9, 0),
  referenceTime: NOON,
} as const;

describe('what it is made of', () => {
  it('renders the field, and keeps its identifier separate from its own', () => {
    render(<TimePicker {...base} defaultOpen defaultValue={TEN} />);

    expect(document.querySelector('[data-ui="time-field"]')).toBeInTheDocument();
    expect(root()).toHaveAttribute('data-ui', contract.ui);
  });

  it('declares every part the contract names', () => {
    render(
      <TimePicker
        {...base}
        defaultOpen
        defaultValue={TEN}
        footer={<button type="button">Aplicar</button>}
        presets={<button type="button">Turno</button>}
      />,
    );

    const present = [...document.querySelectorAll('[data-ui="time-picker"] [data-part]')].map(
      (element) => (element as HTMLElement).dataset['part'],
    );
    for (const part of [
      'control',
      'trigger',
      'content',
      'head',
      'now',
      'presets',
      'list',
      'option',
      'footer',
    ]) {
      expect(present).toContain(part);
    }
  });

  /**
   * One shape, one role. A column per unit was drawn and withdrawn, so the
   * trigger says the same thing in every configuration the family has.
   */
  it('is a listbox, and the trigger says so', () => {
    render(<TimePicker {...base} defaultOpen defaultValue={TEN} />);

    expect(content()).toHaveAttribute('role', 'listbox');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('draws a whole time on every row', () => {
    render(<TimePicker {...base} defaultOpen step={1800} />);
    expect(labels()).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  /** The mark is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the clock on the trigger as a glyph element', () => {
    render(<TimePicker {...base} />);
    const mark = trigger().querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(mark).toHaveAttribute('data-glyph', 'clock');
  });
});

describe('the list the consumer configures', () => {
  it('counts from the lower bound, which is the base a step has', () => {
    render(<TimePicker {...base} defaultOpen min={plainTime(9, 7)} step={900} />);
    expect(labels()?.slice(0, 3)).toEqual(['09:07', '09:22', '09:37']);
  });

  /**
   * The half of the columns question a decline had to answer: no step
   * describes a clinic open at 09:00, 09:20 and 13:45.
   */
  it('offers exactly the times it was given, in the order it was given them', () => {
    render(
      <TimePicker
        locale="pt-BR"
        defaultOpen
        options={[plainTime(9, 0), plainTime(9, 20), plainTime(13, 45)]}
        referenceTime={NOON}
      />,
    );

    expect(labels()).toEqual(['09:00', '09:20', '13:45']);
  });

  it('offers seconds when the consumer states them', () => {
    render(
      <TimePicker
        locale="pt-BR"
        defaultOpen
        granularity="second"
        options={[plainTime(0, 0, 15), plainTime(0, 0, 30)]}
        referenceTime={NOON}
      />,
    );

    expect(labels()).toEqual(['00:00:15', '00:00:30']);
  });

  it('takes a step finer than a minute inside bounds that make it a list', () => {
    render(
      <TimePicker
        locale="pt-BR"
        defaultOpen
        granularity="second"
        max={plainTime(9, 1, 30)}
        min={plainTime(9, 0)}
        referenceTime={NOON}
        step={30}
      />,
    );

    expect(labels()).toEqual(['09:00:00', '09:00:30', '09:01:00', '09:01:30']);
  });

  it('cuts a list that would run past the cap, and says so in the DOM', () => {
    render(<TimePicker locale="pt-BR" defaultOpen referenceTime={NOON} step={1} />);

    expect(optionElements()).toHaveLength(1440);
    expect(document.querySelector('[data-part="list"]')).toHaveAttribute('data-truncated');
    expect(content()).toHaveAttribute('aria-description');
  });

  it('marks what a bound or the predicate refuses, and can hide it instead', () => {
    const refuses = (time: PlainTime) => time.minute === 30;
    const { unmount } = render(
      <TimePicker {...base} defaultOpen isTimeUnavailable={refuses} step={1800} />,
    );
    expect(optionFor('09:30')).toHaveAttribute('aria-disabled', 'true');
    unmount();

    render(
      <TimePicker
        {...base}
        defaultOpen
        isTimeUnavailable={refuses}
        step={1800}
        unavailableOptions="hide"
      />,
    );
    expect(labels()).toEqual(['09:00', '10:00', '11:00']);
  });

  it('says so when no time is available at all, rather than drawing an empty box', () => {
    render(
      <TimePicker {...base} defaultOpen isTimeUnavailable={() => true} unavailableOptions="hide" />,
    );

    expect(document.querySelector('[data-part="empty"]')).toBeInTheDocument();
    expect(optionElements()).toHaveLength(0);
  });

  it('lets the consumer draw the row without owning it', () => {
    render(
      <TimePicker
        {...base}
        defaultOpen
        renderOption={(state) => <span data-testid="row">{state.label} ·</span>}
        step={3600}
      />,
    );

    expect(screen.getAllByTestId('row')[0]).toHaveTextContent('09:00 ·');
  });
});

describe('opening, choosing and closing', () => {
  it('opens on the chosen time', () => {
    render(<TimePicker {...base} defaultOpen defaultValue={TEN} step={1800} />);
    expect(highlighted()).toHaveTextContent('10:00');
  });

  it('opens on the nearest step to now when nothing is chosen', () => {
    render(
      <TimePicker
        {...base}
        defaultOpen
        max={plainTime(13, 0)}
        referenceTime={plainTime(11, 50)}
        step={1800}
      />,
    );
    expect(highlighted()).toHaveTextContent('12:00');
  });

  it('opens on the first available option when the nearest one is refused', () => {
    render(
      <TimePicker
        {...base}
        defaultOpen
        isTimeUnavailable={(time) => time.hour < 10}
        referenceTime={plainTime(9, 0)}
        step={3600}
      />,
    );
    expect(highlighted()).toHaveTextContent('10:00');
  });

  it('chooses on a press and closes, because one press finished the value', () => {
    const onValueChange = vi.fn();
    render(<TimePicker {...base} defaultOpen onValueChange={onValueChange} step={3600} />);

    fireEvent.click(optionFor('10:00'));
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(TEN);
    expect(showing()).toBe(false);
  });

  it('stays open when the consumer says never', () => {
    render(<TimePicker {...base} closeOnSelect="never" defaultOpen step={3600} />);

    fireEvent.click(optionFor('10:00'));
    expect(showing()).toBe(true);
  });

  it('refuses a press on a time a bound or the predicate refuses', () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        {...base}
        defaultOpen
        isTimeUnavailable={(time) => time.hour === 10}
        onValueChange={onValueChange}
        step={3600}
      />,
    );

    fireEvent.click(optionFor('10:00'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('writes the current time from the control at the head', () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        {...base}
        defaultOpen
        onValueChange={onValueChange}
        referenceTime={plainTime(9, 47)}
      />,
    );

    fireEvent.click(document.querySelector('[data-part="now"]') as HTMLElement);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(plainTime(9, 47));
  });

  it('names the trigger with the chosen time, which is where focus returns', () => {
    render(<TimePicker {...base} defaultValue={TEN} />);
    expect(trigger()).toHaveAccessibleName(/10/);
  });
});

describe('the keyboard the pattern lists', () => {
  const openWithKeys = async () => {
    render(<TimePicker {...base} defaultOpen defaultValue={TEN} step={1800} />);
    await waitFor(() => expect(optionElements().length).toBeGreaterThan(0));
  };

  it('moves the highlight without moving the value', async () => {
    await openWithKeys();
    const onValueChange = vi.fn();

    press('ArrowDown', document.querySelector('[data-part="list"]'));
    expect(highlighted()).toHaveTextContent('10:30');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('takes the highlight to either end', async () => {
    await openWithKeys();
    const list = document.querySelector('[data-part="list"]');

    press('End', list);
    expect(highlighted()).toHaveTextContent('11:00');
    press('Home', list);
    expect(highlighted()).toHaveTextContent('09:00');
  });

  /** The coarse axis, without spending a row of the list on a heading. */
  it('pages one hour boundary at a time', async () => {
    render(<TimePicker {...base} defaultOpen defaultValue={plainTime(9, 30)} step={900} />);
    await waitFor(() => expect(optionElements().length).toBeGreaterThan(0));
    const list = document.querySelector('[data-part="list"]');

    press('PageDown', list);
    expect(highlighted()).toHaveTextContent('10:00');
    press('PageUp', list);
    expect(highlighted()).toHaveTextContent('09:00');
  });

  it('jumps to a typed time', async () => {
    await openWithKeys();
    const list = document.querySelector('[data-part="list"]');

    press('1', list);
    press('1', list);
    expect(highlighted()).toHaveTextContent('11:00');
  });

  it('chooses on Enter', async () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        {...base}
        defaultOpen
        defaultValue={TEN}
        onValueChange={onValueChange}
        step={1800}
      />,
    );
    await waitFor(() => expect(optionElements().length).toBeGreaterThan(0));

    const list = document.querySelector('[data-part="list"]');
    press('ArrowDown', list);
    press('Enter', list);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(plainTime(10, 30));
  });

  /**
   * The panel complements the typing and does not replace it, which is what
   * `docs/component-features.md` §6 asks for. The chord leaves focus alone.
   */
  it('opens from the field and leaves focus in it', () => {
    render(<TimePicker {...base} defaultValue={TEN} />);

    const segment = screen.getAllByRole('spinbutton')[0] as HTMLElement;
    segment.focus();
    fireEvent.keyDown(segment, { altKey: true, key: 'ArrowDown' });

    expect(showing()).toBe(true);
    expect(document.activeElement).toBe(segment);
  });
});

describe('the three mutable values', () => {
  it('holds the panel open state and asks before moving it', () => {
    const onOpenChange = vi.fn();
    render(<TimePicker {...base} onOpenChange={onOpenChange} />);

    open();
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
    expect(showing()).toBe(true);
  });

  it('lets a consumer own where the reader is in the list', () => {
    function Owned() {
      const [at, setAt] = useState<PlainTime | null>(plainTime(9, 30));
      return (
        <>
          <button onClick={() => setAt(plainTime(10, 30))} type="button">
            move
          </button>
          <TimePicker
            {...base}
            defaultOpen
            highlightedValue={at}
            onHighlightedValueChange={setAt}
            step={1800}
          />
        </>
      );
    }

    render(<Owned />);
    fireEvent.click(screen.getByRole('button', { name: 'move' }));
    expect(highlighted()).toHaveTextContent('10:30');
  });

  it('posts the chosen time a form can read', () => {
    const { container } = render(<TimePicker {...base} defaultValue={TEN} name="t" />);
    expect(container.querySelector('[data-part="hidden-input"]')).toHaveValue(toISOTime(TEN));
  });
});

describe('what the consumer sets once', () => {
  it('lets an application state the step once', () => {
    render(
      <TimePickerDefaultsProvider step={3600}>
        <TimePicker {...base} defaultOpen />
      </TimePickerDefaultsProvider>,
    );

    expect(labels()).toEqual(['09:00', '10:00', '11:00']);
  });

  it('changes its words and its time format together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <TimePicker
          defaultValue={TEN}
          max={plainTime(11, 0)}
          min={plainTime(9, 0)}
          referenceTime={NOON}
        />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    // language: pt-BR
    expect(trigger()).toHaveAccessibleName(/^Alterar horário, /);
    // language: en-US
    expect(trigger().getAttribute('aria-label')).toContain('10:00');

    rerender(inLocale('en-US'));
    expect(trigger()).toHaveAccessibleName(/^Change time, /);
    expect(trigger().getAttribute('aria-label')).toMatch(/10:00\sAM/);
  });

  it('lays its own messages over the language in force', () => {
    render(<TimePicker {...base} defaultOpen messages={{ now: 'Agora' }} />);

    expect(document.querySelector('[data-part="now"]')).toHaveTextContent('Agora');
  });

  it('lets the picker outrank the provider', () => {
    render(
      <TimePickerDefaultsProvider step={3600}>
        <TimePicker {...base} defaultOpen step={1800} />
      </TimePickerDefaultsProvider>,
    );

    expect(labels()).toHaveLength(5);
  });
});

describe('the escape hatches', () => {
  it('opens and closes through the handle', () => {
    function Held() {
      const [handle, setHandle] = useState<TimePickerHandle | null>(null);
      return (
        <>
          <button onClick={() => handle?.open()} type="button">
            open
          </button>
          <TimePicker {...base} ref={setHandle} />
        </>
      );
    }

    render(<Held />);
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(showing()).toBe(true);
  });

  it('substitutes the frame through render', () => {
    render(<TimePicker {...base} render={(props) => <section {...props} />} />);
    expect(document.querySelector('section[data-ui="time-picker"]')).not.toBeNull();
  });

  it('answers no press at all while it is disabled', () => {
    render(<TimePicker {...base} disabled />);
    expect(trigger()).toBeDisabled();
  });
});
