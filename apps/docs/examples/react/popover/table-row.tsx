import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';

const orders = [
  {
    id: '10248',
    customer: 'Vins et alcools Chevalier',
    carrier: 'Federal Shipping',
    tracking: 'FS-4471-0921',
    shipped: 'Jul 16',
  },
  {
    id: '10249',
    customer: 'Toms Spezialitäten',
    carrier: 'Speedy Express',
    tracking: 'SE-2210-3384',
    shipped: 'Jul 10',
  },
  {
    id: '10250',
    customer: 'Hanari Carnes',
    carrier: 'United Package',
    tracking: 'UP-9035-1172',
    shipped: 'Jul 12',
  },
];

export default function PopoverTableRow() {
  return (
    <Table columns={3}>
      <TableContent>
        <TableCaption>Shipped orders</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Shipment</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <Popover key={order.id} align="end">
              <PopoverAnchor
                render={(props) => (
                  <TableRow {...props} value={order.id}>
                    <TableRowHeader>{order.id}</TableRowHeader>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <PopoverTrigger
                        render={(triggerProps) => (
                          <Button {...triggerProps} size="sm" tone="secondary" variant="ghost">
                            Tracking
                          </Button>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                )}
              />
              <PopoverLayer>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Order {order.id} shipment</PopoverTitle>
                    <PopoverClose />
                  </PopoverHeader>
                  <PopoverBody>
                    <DescriptionList>
                      <DescriptionListItem>
                        <DescriptionListTerm>Carrier</DescriptionListTerm>
                        <DescriptionListDescription>{order.carrier}</DescriptionListDescription>
                      </DescriptionListItem>
                      <DescriptionListItem>
                        <DescriptionListTerm>Tracking</DescriptionListTerm>
                        <DescriptionListDescription>{order.tracking}</DescriptionListDescription>
                      </DescriptionListItem>
                      <DescriptionListItem>
                        <DescriptionListTerm>Shipped</DescriptionListTerm>
                        <DescriptionListDescription>{order.shipped}</DescriptionListDescription>
                      </DescriptionListItem>
                    </DescriptionList>
                  </PopoverBody>
                </PopoverContent>
                <PopoverArrow />
              </PopoverLayer>
            </Popover>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
