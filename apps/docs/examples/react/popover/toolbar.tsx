import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';
import { Toolbar, ToolbarSpacer } from '@slotted/react/toolbar';
import { Text } from '@slotted/react/typography';

const statuses = [
  { value: 'pending', label: 'Pending', orders: 14 },
  { value: 'shipped', label: 'Shipped', orders: 27 },
  { value: 'delivered', label: 'Delivered', orders: 112 },
  { value: 'returned', label: 'Returned', orders: 3 },
];

export default function PopoverToolbar() {
  const [shown, setShown] = useState<readonly string[]>(['pending', 'shipped']);
  const count = statuses
    .filter((status) => shown.includes(status.value))
    .reduce((sum, status) => sum + status.orders, 0);

  return (
    <Toolbar aria-label="Orders">
      <Popover align="start">
        <PopoverTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="ghost">
              Status
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Show orders that are</PopoverTitle>
            </PopoverHeader>
            <PopoverBody>
              <CheckboxGroup aria-label="Status" value={shown} onValueChange={setShown}>
                {statuses.map((status) => (
                  <Checkbox key={status.value} value={status.value}>
                    {status.label}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
      <Popover align="start">
        <PopoverTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="ghost">
              Columns
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Columns</PopoverTitle>
            </PopoverHeader>
            <PopoverBody>
              <CheckboxGroup aria-label="Columns" defaultValue={['customer', 'total']}>
                <Checkbox value="customer">Customer</Checkbox>
                <Checkbox value="ship-via">Ship via</Checkbox>
                <Checkbox value="total">Total</Checkbox>
              </CheckboxGroup>
            </PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
      <ToolbarSpacer />
      <Text size="sm" tone="muted">
        {count} orders
      </Text>
    </Toolbar>
  );
}
