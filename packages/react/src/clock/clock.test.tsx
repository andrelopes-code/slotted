import { plainTime, toISOTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/clock/contract.json';
import { SlottedProvider } from '../i18n';
import { Clock } from './index';
import type { ClockHandle, ClockProps } from './index';

const t = plainTime;
const HALF_PAST_TWO = t(14, 30);

describe('what it is made of', () => {
  it('declares every part the contract names', () => {
    render(
      <>
        <Clock {...base} granularity="second" step={15} />
        <Clock {...base} options={[t(9), t(9, 20)]} />
        <Clock {...base} options={[]} />
      </>,
    );

    for (const part of contract.members.clock.parts) {
      expect(document.querySelector(`[data-part="${part}"]`), part).toBeInTheDocument();
    }
    expect(document.querySelector('[data-part="root"]')).toHaveAttribute('data-ui', contract.ui);
  });

  it('draws the twenty-four hours and the minutes of the step', () => {
    render(<Clock {...base} defaultValue={HALF_PAST_TWO} />);

    expect(hours()).toHaveLength(24);
    expect(minutes().map((option) => option.textContent)).toEqual([':00', ':15', ':30', ':45']);
    expect(selected()).toEqual(['14', ':30']);
  });

  it('draws as many columns as the step asks for', () => {
    const { rerender } = render(<Clock {...base} step={300} />);
    expect(minutes()).toHaveLength(12);
    expect(minutesPart()).toHaveAttribute('data-columns', '6');

    rerender(<Clock {...base} step={60} />);
    expect(minutes()).toHaveLength(60);
    expect(minutesPart()).toHaveAttribute('data-columns', '10');
  });

  it('draws no minutes at the hour granularity, and the seconds at the second', () => {
    const { rerender } = render(<Clock {...base} granularity="hour" />);
    expect(screen.queryByRole('listbox', { name: 'Minutes' })).toBeNull();

    rerender(<Clock {...base} granularity="second" step={15} defaultValue={HALF_PAST_TWO} />);
    expect(options('Seconds').map((option) => option.textContent)).toEqual([
      ':00',
      ':15',
      ':30',
      ':45',
    ]);
  });

  it('draws the hours alone under a step of whole hours', () => {
    render(<Clock {...base} step={7200} />);

    expect(screen.queryByRole('listbox', { name: 'Minutes' })).toBeNull();
  });

  it('names the parts of the day, and the halves of a twelve-hour clock', () => {
    const { rerender } = render(<Clock {...base} defaultValue={HALF_PAST_TWO} />);
    expect(groups()).toEqual(['Night', 'Morning', 'Afternoon', 'Evening']);

    rerender(<Clock {...base} hourCycle={12} />);
    expect(groups()).toEqual(['AM', 'AM', 'PM', 'PM']);
    expect(screen.getByRole('option', { name: '02 PM', selected: true })).toHaveTextContent('2');
  });

  it('outlines the hour it is', () => {
    render(<Clock {...base} now={t(10, 20)} />);

    expect(document.querySelectorAll('[data-now]')).toHaveLength(1);
    expect(hour(10)).toHaveAttribute('data-now');
  });

  it('writes the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Clock />
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(groups()).toEqual(['Madrugada', 'Manhã', 'Tarde', 'Noite']);
    expect(screen.getByRole('listbox', { name: 'Minutos' })).toBeInTheDocument();
    // language: en-US
  });
});

describe('choosing', () => {
  it('writes a whole time from the first hour pressed', () => {
    const change = draw();

    fireEvent.click(hour(14), { detail: 1 });
    expect(last(change)).toEqual(['14:00', 'hour', 'pointer']);

    fireEvent.click(minutes()[2]!, { detail: 1 });
    expect(last(change)).toEqual(['14:30', 'minute', 'pointer']);
  });

  it('keeps the minutes when the hour changes', () => {
    const change = draw({ defaultValue: HALF_PAST_TWO });

    fireEvent.click(hour(9));
    expect(last(change)).toEqual(['09:30', 'hour', 'keyboard']);
  });

  it('takes the nearest accepted minute of an hour that refuses the one held', () => {
    const change = draw({
      defaultValue: HALF_PAST_TWO,
      isTimeUnavailable: (time) => time.hour === 9 && time.minute === 30,
    });

    fireEvent.click(hour(9));
    expect(last(change)?.[0]).toBe('09:15');
  });

  it('writes the afternoon hour of a twelve-hour clock', () => {
    const change = draw({ hourCycle: 12 });

    fireEvent.click(screen.getByRole('option', { name: '02 PM' }));
    expect(last(change)?.[0]).toBe('14:00');
  });

  it('writes a minute of the first hour on offer when nothing is held', () => {
    const change = draw({ min: t(8, 10), step: 1800 });

    expect(minutes().map((option) => option.textContent)).toEqual([]);
    fireEvent.click(hour(8));
    expect(minutes().map((option) => option.textContent)).toEqual([':10', ':40']);
    fireEvent.click(minutes()[1]!);
    expect(last(change)?.[0]).toBe('08:40');
  });

  it('refuses a press on an hour with no accepted time, and keeps it focusable', () => {
    const change = draw({ min: t(9) });

    expect(hour(3)).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(hour(3));
    expect(change).not.toHaveBeenCalled();
    hour(3).focus();
    expect(hour(3)).toHaveFocus();
  });

  it('asks for nothing while disabled or read only', () => {
    const change = vi.fn();
    const { rerender } = render(<Clock {...base} disabled onValueChange={change} />);
    fireEvent.click(hour(3));
    expect(document.querySelector('[role="option"][tabindex="0"]')).toBeNull();

    rerender(<Clock {...base} onValueChange={change} readOnly />);
    fireEvent.click(hour(3));
    expect(change).not.toHaveBeenCalled();
  });

  it('waits for the consumer who owns the value', () => {
    draw({ value: HALF_PAST_TWO });

    fireEvent.click(hour(9));
    expect(selected()).toEqual(['14', ':30']);
  });
});

describe('a stated list', () => {
  const listed = { options: [t(9), t(9, 20), t(13, 45)] };

  it('draws whole times under the part of the day', () => {
    const change = draw({ ...listed, isTimeUnavailable: (time) => time.hour === 13 });

    expect(groups()).toEqual(['Morning', 'Afternoon']);
    fireEvent.click(screen.getByRole('option', { name: '09:20' }));
    expect(last(change)).toEqual(['09:20', 'slot', 'keyboard']);

    fireEvent.click(screen.getByRole('option', { name: '13:45' }));
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('hands the state of a time to renderSlot', () => {
    draw({ ...listed, renderSlot: (state) => `${state.label}, free` });

    expect(screen.getByRole('option', { name: '09:00, free' })).toBeInTheDocument();
  });

  it('says so when it offers nothing', () => {
    draw({ options: [] });

    expect(screen.getByText('No time available')).toBeInTheDocument();
  });
});

describe('the keyboard', () => {
  it('keeps one stop for the hours and one for the minutes', () => {
    draw({ defaultValue: HALF_PAST_TWO });

    expect(stops()).toEqual(['14', ':30']);
  });

  it('moves on both axes and chooses nothing', () => {
    const change = draw({ defaultValue: HALF_PAST_TWO });
    hour(14).focus();

    press('ArrowRight');
    expect(hour(15)).toHaveFocus();
    press('ArrowDown');
    expect(hour(21)).toHaveFocus();
    press('Home');
    expect(hour(18)).toHaveFocus();
    press('End');
    expect(hour(23)).toHaveFocus();
    press('PageUp');
    expect(hour(5)).toHaveFocus();
    press('PageDown');
    expect(hour(23)).toHaveFocus();
    expect(change).not.toHaveBeenCalled();
  });

  it('mirrors the arrows in a right-to-left document', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Clock {...base} defaultValue={HALF_PAST_TWO} />
      </div>,
    );
    hour(14).focus();

    press('ArrowLeft');
    expect(hour(15)).toHaveFocus();
  });

  it('returns the stop to the chosen hour when focus leaves', () => {
    draw({ defaultValue: HALF_PAST_TWO });
    hour(14).focus();
    press('ArrowRight');
    fireEvent.blur(hour(15), { relatedTarget: document.body });

    expect(stops()).toEqual(['14', ':30']);
  });

  it('leaves a chord to the surface around it', () => {
    draw({ defaultValue: HALF_PAST_TWO });
    hour(14).focus();

    expect(fireEvent.keyDown(hour(14), { ctrlKey: true, key: 'ArrowRight' })).toBe(true);
    expect(hour(14)).toHaveFocus();
  });

  it('focuses the chosen hour from its handle', () => {
    const handle = createRef<ClockHandle>();
    render(<Clock {...base} defaultValue={HALF_PAST_TWO} ref={handle} />);

    handle.current?.focus();
    expect(hour(14)).toHaveFocus();
  });
});

const base = { hourCycle: 24, locale: 'en-US' } as const;

type Change = NonNullable<ClockProps['onValueChange']>;

function draw(props: Partial<ClockProps> = {}) {
  const change = vi.fn<Change>();
  render(<Clock {...base} onValueChange={change} {...props} />);

  return change;
}

function last(change: ReturnType<typeof draw>) {
  const call = change.mock.lastCall;

  return call && [iso(call[0]), call[1].unit, call[1].reason];
}

function iso(time: PlainTime | null) {
  return time === null ? null : toISOTime(time, 'minute');
}

function options(name: string): HTMLElement[] {
  const list = screen.queryByRole('listbox', { name });

  return list === null ? [] : within(list).queryAllByRole('option');
}

const hours = () => options('Hours');
const hour = (value: number) => hours()[value]!;
const minutes = () => options('Minutes');
const minutesPart = () => document.querySelector('[data-part="minutes"]');
const groups = () =>
  [...document.querySelectorAll('[role="listbox"] > [role="group"]')].map((group) =>
    group.getAttribute('aria-label'),
  );
const selected = () =>
  screen.getAllByRole('option', { selected: true }).map((option) => option.textContent);
const stops = () =>
  [...document.querySelectorAll('[role="option"][tabindex="0"]')].map((stop) => stop.textContent);
const press = (key: string) => fireEvent.keyDown(document.activeElement!, { key });
