import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const ACCOUNTS = [
  {
    id: '4010',
    label:
      '4010 · Revenue, wholesale channel, net of returns, allowances and early-payment discounts',
  },
  { id: '4020', label: '4020 · Revenue, online store' },
  {
    id: 'urn',
    label: 'urn:northwind:ledger:4030-9f2c41ab8de07c5511903fbe',
    description: 'Imported from the previous ledger',
  },
  {
    id: '5100',
    label: '5100 · Cost of goods sold, including inbound freight and duties',
    description: 'Posted when an order ships, at the weighted average cost of the warehouse',
  },
];

export default function ComboboxLongLabels() {
  return (
    <Field>
      <FieldLabel>Ledger account</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search accounts" />
        <ComboboxContent>
          {ACCOUNTS.map((account) => (
            <ComboboxItem key={account.id} value={account.id} description={account.description}>
              {account.label}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
