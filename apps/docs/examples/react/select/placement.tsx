import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const PAGE_SIZES: SelectOption[] = [
  { value: '25', label: '25 rows' },
  { value: '50', label: '50 rows' },
  { value: '100', label: '100 rows' },
];

const SORTS: (SelectOption & { description: string })[] = [
  { value: 'newest', label: 'Newest', description: 'Most recent order date first.' },
  { value: 'total', label: 'Total', description: 'Largest order total first.' },
  { value: 'ship-date', label: 'Ship date', description: 'Earliest promised ship date first.' },
];

export default function SelectPlacement() {
  return (
    <Inline gap={3} justify="between" align="center">
      <Select side="top" fullWidth={false} defaultValue="25" items={PAGE_SIZES}>
        <SelectTrigger aria-label="Rows per page">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size.value} value={size.value}>
              {size.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select align="end" width="content" fullWidth={false} defaultValue="newest" items={SORTS}>
        <SelectTrigger aria-label="Sort orders">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((sort) => (
            <SelectItem key={sort.value} value={sort.value} description={sort.description}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Inline>
  );
}
