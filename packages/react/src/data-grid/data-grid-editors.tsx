import {
  isPlainDate,
  isPlainDateTime,
  isPlainTime,
  parseISODate,
  parseISODateTime,
  parseISOTime,
  toISODate,
  toISODateTime,
  toISOTime,
} from '@slotted/core/date';
import type { DataGridMessages, FamilyTranslator } from '@slotted/core/i18n';
import type { ReactNode } from 'react';

import { Checkbox } from '../checkbox';
import { DateField } from '../date-field';
import { DateTimeField } from '../datetime-field';
import { NumberField } from '../number-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { TextField } from '../text-field';
import { TimeField } from '../time-field';
import type { DataGridCellContext, DataGridEditorContext } from './data-grid.types';

/** What a cell draws when nothing else says: the formatted text, in one span. */
export function defaultCellContent<Row>(context: DataGridCellContext<Row>): ReactNode {
  return <span title={context.text}>{context.text}</span>;
}

/** `HH` and `HH:MM` are prefixes the engine accepts and the field cannot read. */
export function timeOf(text: unknown) {
  if (!text) return null;
  const written = String(text);
  return parseISOTime(/^\d{2}$/.test(written) ? `${written}:00` : written);
}

export function dateTimeOf(text: unknown) {
  if (!text) return null;
  const written = String(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(written)) return parseISODateTime(`${written}T00:00`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(written)) return parseISODateTime(`${written}:00`);
  return parseISODateTime(written);
}

export function dateOf(text: unknown) {
  return text ? parseISODate(String(text)) : null;
}

/**
 * The editor a kind implies: the field family of that kind, `plain` and `sm`,
 * filling the cell. The draft is the domain value — a number, an ISO day —
 * so what the editor writes is what the column reads back.
 */
export function defaultEditor<Row>(
  context: DataGridEditorContext<Row>,
  t: FamilyTranslator<DataGridMessages>,
  locale: string | undefined,
): ReactNode {
  const { column, draft, setDraft, invalid, message } = context;
  const kind = column.kind ?? 'text';
  const name = column.label;
  const shared = {
    'aria-label': name,
    autoFocus: true,
    invalid: invalid || undefined,
    size: 'sm' as const,
    variant: 'plain' as const,
    ...(message ? { 'aria-errormessage': undefined, title: message } : {}),
  };

  switch (kind) {
    case 'number':
      return (
        <NumberField
          {...shared}
          onValueChange={(value) => setDraft(value)}
          value={typeof draft === 'number' ? draft : null}
          {...(locale === undefined ? {} : { locale })}
        />
      );
    case 'boolean':
      return (
        <Checkbox
          aria-label={name}
          autoFocus
          checked={draft === true}
          onCheckedChange={(checked) => setDraft(checked)}
        />
      );
    case 'date':
      return (
        <DateField
          {...shared}
          onValueChange={(value) => setDraft(isPlainDate(value) ? toISODate(value) : null)}
          value={dateOf(draft)}
          {...(locale === undefined ? {} : { locale })}
        />
      );
    case 'time':
      return (
        <TimeField
          {...shared}
          onValueChange={(value) =>
            setDraft(isPlainTime(value) ? toISOTime(value, 'minute') : null)
          }
          value={timeOf(draft)}
          {...(locale === undefined ? {} : { locale })}
        />
      );
    case 'datetime':
      return (
        <DateTimeField
          {...shared}
          onValueChange={(value) => setDraft(isPlainDateTime(value) ? toISODateTime(value) : null)}
          value={dateTimeOf(draft)}
          {...(locale === undefined ? {} : { locale })}
        />
      );
    case 'set': {
      const options = column.options ?? [];
      const multiple = Array.isArray(context.value);
      return (
        <Select
          fullWidth
          items={options.map((option) => ({ label: option.label, value: option.value }))}
          multiple={multiple}
          onValueChange={(value) => setDraft(value)}
          size="sm"
          value={
            multiple
              ? ((draft as readonly string[] | null) ?? [])
              : draft === null || draft === undefined
                ? null
                : String(draft)
          }
          variant="plain"
        >
          <SelectTrigger aria-label={name} autoFocus>
            <SelectValue placeholder={t('filterAny')} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    default:
      return (
        <TextField
          {...shared}
          onValueChange={(value) => setDraft(value)}
          value={draft === null || draft === undefined ? '' : String(draft)}
        />
      );
  }
}
