import { Checkbox } from '@slotted/react/checkbox';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

const INVOICES = [
  { id: 'INV-1042', customer: 'Alfreds Futterkiste', amount: '$1,250.00' },
  { id: 'INV-1043', customer: 'Ernst Handel', amount: '$4,318.40' },
  { id: 'INV-1044', customer: 'Island Trading', amount: '$872.15' },
];

export default function CheckboxHiddenLabel() {
  return (
    <Stack gap={2}>
      {INVOICES.map((invoice) => (
        <Inline key={invoice.id} gap={3} align="center">
          <Checkbox size="sm" value={invoice.id}>
            <VisuallyHidden>Select {invoice.id}</VisuallyHidden>
          </Checkbox>
          <Text numeric="tabular">{invoice.id}</Text>
          <Text tone="muted">{invoice.customer}</Text>
          <Text numeric="tabular">{invoice.amount}</Text>
        </Inline>
      ))}
    </Stack>
  );
}
