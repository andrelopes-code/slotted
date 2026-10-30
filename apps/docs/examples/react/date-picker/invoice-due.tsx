import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';
import {
  addDays,
  createDateFormat,
  isPlainDate,
  plainDate,
  type PlainDate,
} from '@slotted/core/date';

const TERMS = [
  { value: 'receipt', label: 'Due on receipt', days: 0 },
  { value: 'net-15', label: 'Net 15', days: 15 },
  { value: 'net-30', label: 'Net 30', days: 30 },
  { value: 'net-60', label: 'Net 60', days: 60 },
];
const words = createDateFormat({ locale: 'en-US' });

export default function DatePickerInvoiceDue() {
  const [issued, setIssued] = useState<PlainDate | null>(plainDate(2026, 9, 30));
  const [terms, setTerms] = useState('net-30');
  const days = TERMS.find((option) => option.value === terms)?.days ?? 0;
  const due = issued === null ? null : addDays(issued, days);

  return (
    <Stack gap={5}>
      <Field required>
        <FieldLabel>Invoice date</FieldLabel>
        <DatePicker
          onValueChange={(value) => setIssued(isPlainDate(value) ? value : null)}
          value={issued}
        />
      </Field>
      <Field>
        <FieldLabel>Payment terms</FieldLabel>
        <Select
          items={TERMS}
          onValueChange={(next) => {
            if (typeof next === 'string') setTerms(next);
          }}
          value={terms}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERMS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field readOnly>
        <FieldLabel>Due date</FieldLabel>
        <DatePicker value={due} />
        <FieldDescription>
          {due === null ? 'Set the invoice date first.' : `Payment is due ${words.describe(due)}.`}
        </FieldDescription>
      </Field>
    </Stack>
  );
}
