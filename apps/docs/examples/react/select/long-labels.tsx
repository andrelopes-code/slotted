import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const LISTINGS: SelectOption[] = [
  {
    value: 'mug-sage',
    label: 'Stoneware mug, 12 oz, sage glaze, case of 24, for the autumn wholesale catalogue',
  },
  { value: 'mug-sku', label: 'SKU-NW-STONEWARE-MUG-12OZ-SAGE-GLAZE-CASE24-WHOLESALE' },
  { value: 'tumbler', label: 'Glass tumbler, 8 oz' },
];

export default function SelectLongLabels() {
  return (
    <Field>
      <FieldLabel>Catalogue listing</FieldLabel>
      <Select defaultValue="mug-sage" items={LISTINGS}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LISTINGS.map((listing) => (
            <SelectItem key={listing.value} value={listing.value}>
              {listing.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
