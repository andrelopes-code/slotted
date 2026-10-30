import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const STATUSES: SelectOption[] = [
  { value: 'open', label: 'Open' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'shipped', label: 'Shipped' },
];

const CHANNELS: SelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'phone', label: 'Phone orders' },
];

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

export default function SelectNarrow() {
  return (
    <Stack gap={4} style={{ inlineSize: '7rem' }}>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select size="sm" defaultValue="on-hold" items={STATUSES}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Channels</FieldLabel>
        <Select
          size="sm"
          multiple
          defaultValue={['web', 'marketplace', 'wholesale']}
          items={CHANNELS}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHANNELS.map((channel) => (
              <SelectItem key={channel.value} value={channel.value}>
                {channel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Warehouse</FieldLabel>
        <Select size="sm" width="content" defaultValue="CMH" items={WAREHOUSES}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WAREHOUSES.map((warehouse) => (
              <SelectItem key={warehouse.value} value={warehouse.value}>
                {warehouse.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </Stack>
  );
}
