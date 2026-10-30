import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs, type TabsSize } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const SIZES: TabsSize[] = ['sm', 'md', 'lg'];

const VIEWS = [
  { value: 'stock', label: 'Stock', panel: '1,284 units on hand across 3 warehouses.' },
  { value: 'movements', label: 'Movements', panel: '46 movements in the last 7 days.' },
  {
    value: 'suppliers',
    label: 'Suppliers',
    panel: 'Ordered from Brightline Studio and Quill & Co.',
  },
];

export default function TabsSizes() {
  return (
    <Stack gap={8}>
      {SIZES.map((size) => (
        <Tabs key={size} defaultValue="stock" size={size}>
          <TabList aria-label="Product OAK-90">
            {VIEWS.map((view) => (
              <Tab key={view.value} value={view.value}>
                {view.label}
              </Tab>
            ))}
          </TabList>
          {VIEWS.map((view) => (
            <TabPanel key={view.value} value={view.value}>
              <Text size="sm">{view.panel}</Text>
            </TabPanel>
          ))}
        </Tabs>
      ))}
    </Stack>
  );
}
