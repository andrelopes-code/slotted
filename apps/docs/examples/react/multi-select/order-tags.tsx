import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';

const TAGS: MultiSelectOption[] = [
  { value: 'priority', label: 'priority' },
  { value: 'gift wrap', label: 'gift wrap' },
  { value: 'fragile', label: 'fragile' },
  { value: 'backorder', label: 'backorder' },
  { value: 'address check', label: 'address check' },
  { value: 'wholesale', label: 'wholesale' },
];

const ORDERS = [
  { id: 'SO-10482', customer: 'Harbor & Pine', tags: ['priority', 'fragile'] },
  { id: 'SO-10483', customer: 'Brightline Studio', tags: ['address check'] },
  { id: 'SO-10484', customer: 'Northgate Labs', tags: ['wholesale', 'backorder', 'priority'] },
  { id: 'SO-10485', customer: 'Verde Kitchen', tags: [] },
];

export default function MultiSelectOrderTags() {
  return (
    <Table columns={3}>
      <TableContent aria-label="Orders">
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Tags</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ORDERS.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader>{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell>
                <MultiSelect
                  variant="plain"
                  size="sm"
                  overflow="collapse"
                  creatable
                  defaultValue={order.tags}
                  items={TAGS}
                >
                  <MultiSelectControl aria-label={`Tags for ${order.id}`} placeholder="Add a tag" />
                  <MultiSelectContent aria-label={`Tags for ${order.id}`}>
                    {TAGS.map((tag) => (
                      <MultiSelectItem key={tag.value} value={tag.value}>
                        {tag.label}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectContent>
                </MultiSelect>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
