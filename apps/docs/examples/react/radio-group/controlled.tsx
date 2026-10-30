import { useState } from 'react';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Stack } from '@slotted/react/stack';

const TOTALS: Record<string, string> = {
  usd: '$1,240.00',
  eur: '€1,147.00',
  gbp: '£982.00',
};

export default function RadioGroupControlled() {
  const [currency, setCurrency] = useState('usd');

  return (
    <Stack gap={4}>
      <FieldGroup>
        <FieldGroupLegend>Invoice currency</FieldGroupLegend>
        <FieldGroupContent>
          <RadioGroup orientation="horizontal" value={currency} onValueChange={setCurrency}>
            <Radio value="usd">USD</Radio>
            <Radio value="eur">EUR</Radio>
            <Radio value="gbp">GBP</Radio>
          </RadioGroup>
        </FieldGroupContent>
      </FieldGroup>
      <span>Invoice total: {TOTALS[currency]}</span>
    </Stack>
  );
}
