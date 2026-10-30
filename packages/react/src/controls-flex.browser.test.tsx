import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { Cascader } from './cascader';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from './combobox';
import { CurrencyField } from './currency-field';
import { DateField } from './date-field';
import { DatePicker } from './date-picker';
import { DateRangePicker } from './date-range-picker';
import { DateTimeField } from './datetime-field';
import { DateTimePicker } from './datetime-picker';
import { DateTimeRangePicker } from './datetime-range-picker';
import { EntityPicker } from './entity-picker';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from './multi-select';
import { NumberField } from './number-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { TagsInput } from './tags-input';
import { TextField } from './text-field';
import { Textarea } from './textarea';
import { TimeField } from './time-field';
import { TimePicker } from './time-picker';
import { TimeRangePicker } from './time-range-picker';

const place = { id: 'pt', name: 'Portugal' };

const controls: Record<string, () => ReactElement> = {
  cascader: () => (
    <Cascader
      aria-label="Location"
      getKey={(node: typeof place) => node.id}
      getLabel={(node: typeof place) => node.name}
      nodes={[place]}
    />
  ),
  combobox: () => (
    <Combobox>
      <ComboboxInput aria-label="Fruit" />
      <ComboboxContent aria-label="Fruit">
        <ComboboxItem value="fig">Fig</ComboboxItem>
      </ComboboxContent>
    </Combobox>
  ),
  'currency-field': () => <CurrencyField aria-label="Amount" currency="BRL" locale="pt-BR" />,
  'date-field': () => <DateField aria-label="Due" locale="pt-BR" />,
  'date-picker': () => <DatePicker aria-label="Due" locale="pt-BR" />,
  'date-range-picker': () => <DateRangePicker aria-label="Period" locale="pt-BR" />,
  'datetime-field': () => <DateTimeField aria-label="When" locale="pt-BR" />,
  'datetime-picker': () => <DateTimePicker aria-label="When" locale="pt-BR" />,
  'datetime-range-picker': () => <DateTimeRangePicker aria-label="Run" locale="pt-BR" />,
  'entity-picker': () => <EntityPicker aria-label="Owner" items={[{ id: 'ana', label: 'Ana' }]} />,
  'multi-select': () => (
    <MultiSelect>
      <MultiSelectControl aria-label="Fruit" />
      <MultiSelectContent aria-label="Fruit">
        <MultiSelectItem value="fig">Fig</MultiSelectItem>
      </MultiSelectContent>
    </MultiSelect>
  ),
  'number-field': () => <NumberField aria-label="Units" />,
  select: () => (
    <Select defaultValue="BRL">
      <SelectTrigger aria-label="Currency">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="BRL">BRL</SelectItem>
      </SelectContent>
    </Select>
  ),
  'tags-input': () => <TagsInput aria-label="To" />,
  'text-field': () => <TextField aria-label="Note" />,
  textarea: () => <Textarea aria-label="Note" />,
  'time-field': () => <TimeField aria-label="Start" locale="pt-BR" />,
  'time-picker': () => <TimePicker aria-label="Start" locale="pt-BR" />,
  'time-range-picker': () => <TimeRangePicker aria-label="Shift" locale="pt-BR" />,
};

const width = (element: Element) => element.getBoundingClientRect().width;

/* A root fills its field at `inline-size: 100%`, and in a flex row that
   percentage used to be every item's basis: two controls side by side split
   the row instead of keeping the width their content needs, and the shrink
   clipped a date's segments. */
describe('a field control as a flex item', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it.each(Object.keys(controls))('%s keeps its own width in a row and fills a field', (ui) => {
    const Control = controls[ui]!;
    render(
      <>
        <div data-testid="alone" style={{ display: 'inline-block' }}>
          <Control />
        </div>
        <div data-testid="row" style={{ display: 'flex', inlineSize: '2400px', gap: '12px' }}>
          <Control />
          <Control />
        </div>
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            inlineSize: '900px',
          }}
        >
          <Control />
        </div>
      </>,
    );
    const roots = [...document.querySelectorAll(`[data-ui="${ui}"][data-part="root"]`)];
    const [alone, first, second, field] = roots.filter(
      (root) => root.parentElement?.closest(`[data-ui="${ui}"]`) === null,
    );

    expect(width(first!)).toBeLessThan(1200);
    expect(Math.abs(width(first!) - width(alone!))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(width(second!) - width(alone!))).toBeLessThanOrEqual(0.5);
    expect(width(field!)).toBe(900);
  });
});
