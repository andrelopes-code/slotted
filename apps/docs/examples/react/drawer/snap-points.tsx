import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const SHIPMENTS = [
  { id: 'SH-4471', to: 'Contoso Foods, Seattle', status: 'In transit', tone: 'accent' },
  { id: 'SH-4472', to: 'Fabrikam Grocers, Portland', status: 'In transit', tone: 'accent' },
  { id: 'SH-4473', to: 'Tailspin Market, Boise', status: 'Delayed', tone: 'warning' },
  { id: 'SH-4474', to: 'Adventure Works, Denver', status: 'In transit', tone: 'accent' },
  {
    id: 'SH-4475',
    to: 'Litware Deli, Salt Lake City',
    status: 'Out for delivery',
    tone: 'success',
  },
  { id: 'SH-4476', to: 'Proseware Cafe, Spokane', status: 'In transit', tone: 'accent' },
  { id: 'SH-4477', to: 'Wingtip Bakery, Eugene', status: 'Delayed', tone: 'warning' },
  { id: 'SH-4478', to: 'Coho Winery, Walla Walla', status: 'Out for delivery', tone: 'success' },
  { id: 'SH-4479', to: 'Northwind Outlet, Reno', status: 'In transit', tone: 'accent' },
  { id: 'SH-4480', to: 'Fourth Coffee, Tacoma', status: 'In transit', tone: 'accent' },
] as const;

export default function DrawerSnapPoints() {
  return (
    <Drawer defaultExtent={0.4} side="bottom" snapPoints={[0.4, 0.9]}>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Shipments in transit
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerResizer />
        <DrawerHeader>
          <DrawerTitle>Shipments in transit</DrawerTitle>
          <DrawerDescription>10 shipments left the Reno warehouse this week.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={3}>
            {SHIPMENTS.map((shipment) => (
              <Inline key={shipment.id} align="center" gap={3} justify="between">
                <Stack gap={0}>
                  <Text size="sm" weight="semibold">
                    {shipment.id}
                  </Text>
                  <Text size="sm" tone="muted">
                    {shipment.to}
                  </Text>
                </Stack>
                <Badge tone={shipment.tone}>{shipment.status}</Badge>
              </Inline>
            ))}
          </Stack>
        </DrawerBody>
      </DrawerPanel>
    </Drawer>
  );
}
