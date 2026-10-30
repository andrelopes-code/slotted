import { useState } from 'react';
import { Checkbox } from '@slotted/react/checkbox';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

function summary(taxable: boolean | 'mixed'): string {
  if (taxable === 'mixed') return 'Taxed on 2 of the 3 selected products.';
  return taxable
    ? 'All 3 selected products will be taxed.'
    : 'None of the 3 selected products will be taxed.';
}

export default function CheckboxIndeterminate() {
  const [taxable, setTaxable] = useState<boolean | 'mixed'>('mixed');

  return (
    <Stack gap={3}>
      <Text weight="medium">Edit 3 products</Text>
      <Checkbox
        checked={taxable === true}
        indeterminate={taxable === 'mixed'}
        onCheckedChange={(checked) => setTaxable(checked)}
        description={summary(taxable)}
      >
        Taxable
      </Checkbox>
    </Stack>
  );
}
