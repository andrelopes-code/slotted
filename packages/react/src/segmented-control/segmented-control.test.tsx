import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/segmented-control/contract.json';
import { Field, FieldLabel } from '../field';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import { SegmentedControl } from './segmented-control';
import { SegmentedControlDefaultsProvider } from './segmented-control-defaults';
import { Segment } from './segmented-control-parts';
import type { SegmentedControlProps } from './segmented-control.types';

const OPTIONS = ['day', 'week', 'month'];

const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];
const radio = (index: number) => radios()[index] as HTMLInputElement;
const control = () => screen.getByRole('radiogroup');
const segmentOf = (input: HTMLInputElement) => input.closest('[data-part="item"]') as HTMLElement;
const thumb = () => control().querySelector('[data-part="indicator"]');

function Range(props: Partial<SegmentedControlProps>) {
  return (
    <SegmentedControl aria-label="Chart range" {...props}>
      {OPTIONS.map((option) => (
        <Segment key={option} value={option}>
          {option}
        </Segment>
      ))}
    </SegmentedControl>
  );
}

describe('SegmentedControl', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Range className="report-range" defaultValue="week" />);

    expect(control().tagName).toBe('DIV');
    expect(control()).toHaveAttribute('data-ui', contract.ui);
    expect(control()).toHaveAttribute('data-part', 'root');
    expect(control()).toHaveClass('report-range');

    const segment = segmentOf(radio(1));
    expect(segment.tagName).toBe('LABEL');
    expect(segment).toHaveAttribute('data-part', 'item');
    expect(radio(1)).toHaveAttribute('data-part', 'control');
    expect(segment.querySelector('[data-part="label"]')).toHaveTextContent('week');
  });

  /**
   * The decision the whole pair rests on: a segment is a real radio, so the
   * platform supplies the keyboard, the submitted value and the position a
   * screen reader announces.
   */
  it('is a radio group in the DOM, sharing one generated name', () => {
    render(<Range />);

    expect(radios()).toHaveLength(3);
    const name = radio(0).name;
    expect(name).not.toBe('');
    for (const input of radios()) expect(input.name).toBe(name);
    expect(control()).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('submits under the name a consumer states', () => {
    render(<Range defaultValue="week" name="range" />);

    for (const input of radios()) expect(input.name).toBe('range');
    expect(radio(1).checked).toBe(true);
  });

  /**
   * The thumb's place is the checked index and its width is one of the equal
   * columns. Both are written on the first render, which is what makes the
   * server-rendered paint correct where a measured one is not.
   */
  it('states the count and the checked index without measuring anything', () => {
    render(<Range defaultValue="month" />);

    expect(control().style.getPropertyValue('--slotted-segmented-control-count')).toBe('3');
    expect(control().style.getPropertyValue('--slotted-segmented-control-index')).toBe('2');
    expect(thumb()).not.toBeNull();
  });

  it('paints no thumb while nothing is checked', () => {
    render(<Range />);

    expect(thumb()).toBeNull();
    expect(control().style.getPropertyValue('--slotted-segmented-control-index')).toBe('');
    expect(control().style.getPropertyValue('--slotted-segmented-control-count')).toBe('3');
  });

  it('counts the segments a consumer produced with a map inside a fragment', () => {
    render(
      <SegmentedControl aria-label="Chart range" defaultValue="week">
        <>
          {OPTIONS.map((option) => (
            <Segment key={option} value={option}>
              {option}
            </Segment>
          ))}
        </>
      </SegmentedControl>,
    );

    expect(control().style.getPropertyValue('--slotted-segmented-control-count')).toBe('3');
    expect(control().style.getPropertyValue('--slotted-segmented-control-index')).toBe('1');
  });

  it('moves its own value and marks the segment it moved to', () => {
    render(<Range defaultValue="day" />);

    fireEvent.click(radio(2));

    expect(radio(2).checked).toBe(true);
    expect(segmentOf(radio(2))).toHaveAttribute('data-checked', '');
    expect(segmentOf(radio(0))).not.toHaveAttribute('data-checked');
    expect(control().style.getPropertyValue('--slotted-segmented-control-index')).toBe('2');
  });

  it('asks and waits while a consumer owns the value', () => {
    const onValueChange = vi.fn();
    render(<Range onValueChange={onValueChange} value="day" />);

    fireEvent.click(radio(1));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toBe('week');
    expect(radio(0).checked).toBe(true);
    expect(radio(1).checked).toBe(false);
  });

  /** A boolean cannot say why, so every request carries the reason and the event. */
  it('says why the value moved, and with which event', () => {
    const onValueChange = vi.fn();
    render(<Range defaultValue="day" onValueChange={onValueChange} />);

    fireEvent.click(radio(1), { detail: 1 });
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('pointer');
    expect(onValueChange.mock.calls[0]?.[1].previous).toBe('day');

    fireEvent.click(radio(2), { detail: 0 });
    expect(onValueChange.mock.calls[1]?.[1].reason).toBe('keyboard');
  });

  it('lets a consumer refuse a change before it commits', () => {
    render(
      <Range
        defaultValue="day"
        onValueChange={(_value, request) => {
          request.cancel();
        }}
      />,
    );

    fireEvent.click(radio(1));

    expect(radio(0).checked).toBe(true);
    expect(radio(1).checked).toBe(false);
  });

  it('emits nothing for the value it already holds', () => {
    const onValueChange = vi.fn();
    render(<Range defaultValue="week" onValueChange={onValueChange} />);

    fireEvent.click(radio(1));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  /** A radio ignores `readonly`, so the family refuses the change itself. */
  it('refuses a change while it is read-only, and does not look disabled', () => {
    const onValueChange = vi.fn();
    render(<Range defaultValue="day" onValueChange={onValueChange} readOnly />);

    fireEvent.click(radio(1));

    expect(radio(0).checked).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(control()).toHaveAttribute('aria-readonly', 'true');
    expect(control()).toHaveAttribute('data-readonly', '');
    for (const input of radios()) expect(input.disabled).toBe(false);
  });

  it('disables every segment when the control is disabled, and one when it is not', () => {
    const { rerender } = render(<Range disabled />);
    for (const input of radios()) expect(input.disabled).toBe(true);
    expect(control()).toHaveAttribute('data-disabled', '');

    rerender(
      <SegmentedControl aria-label="Chart range">
        <Segment value="day">day</Segment>
        <Segment disabled value="week">
          week
        </Segment>
      </SegmentedControl>,
    );
    expect(radio(0).disabled).toBe(false);
    expect(radio(1).disabled).toBe(true);
    expect(segmentOf(radio(1))).toHaveAttribute('data-disabled', '');
  });

  it('announces invalid and required without inventing a second way to say it', () => {
    render(<Range invalid required />);

    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(control()).toHaveAttribute('data-invalid', '');
    expect(control()).toHaveAttribute('aria-required', 'true');
  });

  it('takes its size, its state and its description from the field around it', () => {
    render(
      <Field invalid size="lg">
        <FieldLabel>Range</FieldLabel>
        <Range />
      </Field>,
    );

    expect(control()).toHaveAttribute('data-size', 'lg');
    expect(control()).toHaveAttribute('data-invalid', '');
  });

  /** A `fieldset` with a `legend` is already a named group. */
  it('withdraws its role inside a field group', () => {
    render(
      <FieldGroup>
        <FieldGroupLegend>Range</FieldGroupLegend>
        <Range />
      </FieldGroup>,
    );

    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(radios()).toHaveLength(3);
  });

  it('lets an application state its axes once', () => {
    render(
      <SegmentedControlDefaultsProvider condense="icons" fullWidth orientation="vertical" size="sm">
        <Range />
      </SegmentedControlDefaultsProvider>,
    );

    expect(control()).toHaveAttribute('data-size', 'sm');
    expect(control()).toHaveAttribute('data-orientation', 'vertical');
    expect(control()).toHaveAttribute('data-condense', 'icons');
    expect(control()).toHaveAttribute('data-full-width', '');
  });

  it('lets one control outrank the application', () => {
    render(
      <SegmentedControlDefaultsProvider size="sm">
        <Range size="lg" />
      </SegmentedControlDefaultsProvider>,
    );

    expect(control()).toHaveAttribute('data-size', 'lg');
  });

  it('runs the consumer’s own handler before its own, and honours a refusal', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <SegmentedControl aria-label="Chart range" defaultValue="day">
        <Segment value="day">day</Segment>
        <Segment onClick={onClick} value="week">
          week
        </Segment>
      </SegmentedControl>,
    );

    fireEvent.click(radio(1));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(radio(0).checked).toBe(true);
  });

  it('hands the consumer the elements it wrote', () => {
    const root = createRef<HTMLDivElement>();
    const input = createRef<HTMLInputElement>();
    render(
      <SegmentedControl aria-label="Chart range" ref={root}>
        <Segment ref={input} value="day">
          day
        </Segment>
      </SegmentedControl>,
    );

    expect(root.current).toBe(control());
    expect(input.current).toBe(radio(0));
  });

  it('renders the root into another element without losing its identity', () => {
    render(
      <SegmentedControl aria-label="Chart range" render={(props) => <section {...props} />}>
        <Segment value="day">day</Segment>
      </SegmentedControl>,
    );

    const root = screen.getByRole('radiogroup');
    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-ui', contract.ui);
  });

  it('draws the mark a segment was given, hidden from the reading order', () => {
    render(
      <SegmentedControl aria-label="Result view">
        <Segment icon={<svg data-testid="grid" />} value="grid">
          Grid
        </Segment>
      </SegmentedControl>,
    );

    const mark = screen.getByTestId('grid').parentElement as HTMLElement;
    expect(mark).toHaveAttribute('data-part', 'icon');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a controlled value the consumer moves', () => {
    function Controlled() {
      const [value, setValue] = useState('day');
      return <Range onValueChange={setValue} value={value} />;
    }
    render(<Controlled />);

    fireEvent.click(radio(2));

    expect(radio(2).checked).toBe(true);
    expect(control().style.getPropertyValue('--slotted-segmented-control-index')).toBe('2');
  });

  it('refuses to render a segment outside a control', () => {
    const noise = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Segment value="day">day</Segment>)).toThrow(
      /must be rendered inside a SegmentedControl/,
    );
    noise.mockRestore();
  });
});

/**
 * A few words, the chosen one underlined in the text colour: the same radio
 * group — one tab stop, the arrows move the value — drawn with no track.
 */
describe('the underline variant', () => {
  function Period(props: Partial<SegmentedControlProps>) {
    return (
      <SegmentedControl {...props}>
        {['Day', 'Week', 'Month'].map((option) => (
          <Segment key={option} value={option}>
            {option}
          </Segment>
        ))}
      </SegmentedControl>
    );
  }

  it('draws the radio group as words and keeps its semantics', () => {
    render(<Period aria-label="Period" defaultValue="Week" variant="underline" />);
    expect(control()).toHaveAttribute('data-variant', 'underline');
    expect(control()).toHaveAccessibleName('Period');
    expect(radios()).toHaveLength(3);
    expect(new Set(radios().map((input) => input.name)).size).toBe(1);
    expect(radio(1)).toBeChecked();
    expect(segmentOf(radio(1))).toHaveAttribute('data-checked');
  });

  it('writes the track variant by default', () => {
    render(<Period aria-label="Period" />);
    expect(control()).toHaveAttribute('data-variant', 'track');
  });

  it('is named by the label of the field around it', () => {
    render(
      <Field>
        <FieldLabel>Period</FieldLabel>
        <Period variant="underline" />
      </Field>,
    );
    expect(control()).toHaveAccessibleName('Period');
  });
});
