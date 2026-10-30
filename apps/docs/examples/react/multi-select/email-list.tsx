import { useState } from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectRefuseCause,
} from '@slotted/react/multi-select';

const TEAMS = [
  { value: 'purchasing@northwind.example', description: 'Purchasing team' },
  { value: 'warehouse-ops@northwind.example', description: 'Warehouse operations' },
  { value: 'category-managers@northwind.example', description: 'Category managers' },
];

const isEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

const REASONS: Record<MultiSelectRefuseCause, string> = {
  invalid: 'is not an email address',
  duplicate: 'is already on the list',
  limit: 'is over the limit',
};

export default function MultiSelectEmailList() {
  const [refused, setRefused] = useState<string | null>(null);

  return (
    <Field invalid={refused !== null ? true : undefined}>
      <FieldLabel>Stockout alerts</FieldLabel>
      <MultiSelect
        creatable
        delimiters={[',', ';', ' ']}
        defaultValue={['purchasing@northwind.example']}
        validateValue={isEmail}
        onValueRefuse={(values, { cause }) => setRefused(`${values.join(', ')} ${REASONS[cause]}.`)}
        onValueChange={() => setRefused(null)}
      >
        <MultiSelectControl placeholder="name@company.com" />
        <MultiSelectContent>
          {TEAMS.map((team) => (
            <MultiSelectItem key={team.value} value={team.value} description={team.description}>
              {team.value}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      {refused === null ? (
        <FieldDescription>Paste a list separated by commas, semicolons or spaces.</FieldDescription>
      ) : (
        <FieldError live="polite">{refused}</FieldError>
      )}
    </Field>
  );
}
