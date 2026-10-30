import { useState } from 'react';
import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const SPEEDS = [
  { value: 'ground', label: 'Ground', transit: '3–5 business days', price: '$8.40' },
  { value: 'two-day', label: 'Two-day', transit: '2 business days', price: '$18.90' },
  { value: 'overnight', label: 'Overnight', transit: 'Next business day', price: '$42.75' },
];

export default function SelectControlled() {
  const [speed, setSpeed] = useState('ground');
  const chosen = SPEEDS.find((option) => option.value === speed);

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Delivery speed</FieldLabel>
        <Select
          value={speed}
          items={SPEEDS}
          onValueChange={(next) => {
            if (typeof next === 'string') setSpeed(next);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <span>
        Arrives in {chosen?.transit}. Shipping: {chosen?.price}
      </span>
    </Stack>
  );
}
