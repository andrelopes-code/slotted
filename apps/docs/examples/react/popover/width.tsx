import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  PopoverTrigger,
} from '@slotted/react/popover';

const warehouses = [
  { name: 'Seattle', stock: '39 units' },
  { name: 'Tacoma', stock: '120 units' },
  { name: 'Portland', stock: 'Out of stock' },
];

export default function PopoverWidth() {
  return (
    <Popover align="start" width="anchor">
      <PopoverTrigger
        render={(props) => (
          <Button {...props} fullWidth tone="secondary" variant="outline">
            Chai, stock by warehouse
          </Button>
        )}
      />
      <PopoverLayer>
        <PopoverContent aria-label="Chai stock by warehouse">
          <PopoverBody>
            <DescriptionList>
              {warehouses.map((warehouse) => (
                <DescriptionListItem key={warehouse.name}>
                  <DescriptionListTerm>{warehouse.name}</DescriptionListTerm>
                  <DescriptionListDescription>{warehouse.stock}</DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
          </PopoverBody>
        </PopoverContent>
        <PopoverArrow />
      </PopoverLayer>
    </Popover>
  );
}
