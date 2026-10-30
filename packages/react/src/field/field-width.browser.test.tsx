import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { DatePicker } from '../date-picker';
import { DateRangePicker } from '../date-range-picker';
import { DateTimePicker } from '../datetime-picker';
import { DateTimeRangePicker } from '../datetime-range-picker';
import { TextField } from '../text-field';
import { TimePicker } from '../time-picker';
import { TimeRangePicker } from '../time-range-picker';
import { Field, FieldLabel } from './index';

/**
 * A field of width `full` gives its control the field's width. A picker's
 * control is the field family it holds, and a flex item at its content
 * width left the frame a third of the way into a 26rem column.
 */
describe('a picker in a field of width full', () => {
  it.each(PICKERS)('%s fills the field as a text field does', (_name, picker) => {
    render(
      <div style={{ inlineSize: '26rem' }}>
        <Field>
          <FieldLabel>Picker</FieldLabel>
          {picker}
        </Field>
        <Field>
          <FieldLabel>Note</FieldLabel>
          <TextField />
        </Field>
      </div>,
    );
    const [pickerField, textField] = document.querySelectorAll('[data-ui="field"]');

    const pickerWidth = pickerFrame(pickerField)?.getBoundingClientRect().width;
    const textWidth = textField
      ?.querySelector('[data-ui="text-field"]')
      ?.getBoundingClientRect().width;

    expect(pickerWidth).toBe(textWidth);
  });

  it('stops at the step of a field of width medium', () => {
    render(
      <div style={{ inlineSize: '26rem' }}>
        <Field width="medium">
          <FieldLabel>Due date</FieldLabel>
          <DatePicker />
        </Field>
      </div>,
    );
    const field = document.querySelector('[data-ui="field"]') ?? undefined;

    const width = pickerFrame(field)?.getBoundingClientRect().width;

    expect(width).toBe(240);
  });
});

const PICKERS: Array<[string, ReactNode]> = [
  ['date-picker', <DatePicker key="date" />],
  ['date-range-picker', <DateRangePicker key="date-range" />],
  ['time-picker', <TimePicker key="time" />],
  ['time-range-picker', <TimeRangePicker key="time-range" />],
  ['datetime-picker', <DateTimePicker key="datetime" />],
  ['datetime-range-picker', <DateTimeRangePicker key="datetime-range" />],
];

/** The box that draws the border: the field family a single picker holds, or a range's own control. */
function pickerFrame(field: Element | undefined) {
  const control = field?.querySelector('[data-ui$="picker"] [data-part="control"]');

  return control?.querySelector(':scope > [data-ui$="-field"]') ?? control;
}
