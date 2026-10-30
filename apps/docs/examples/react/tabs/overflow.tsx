import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const WAREHOUSES = [
  { code: 'RNO', city: 'Reno, NV', open: 42 },
  { code: 'CMH', city: 'Columbus, OH', open: 37 },
  { code: 'SAV', city: 'Savannah, GA', open: 18 },
  { code: 'DFW', city: 'Dallas, TX', open: 51 },
  { code: 'EWR', city: 'Newark, NJ', open: 29 },
  { code: 'ONT', city: 'Ontario, CA', open: 64 },
  { code: 'JOT', city: 'Joliet, IL', open: 23 },
  { code: 'MEM', city: 'Memphis, TN', open: 46 },
  { code: 'ABE', city: 'Allentown, PA', open: 12 },
  { code: 'TIW', city: 'Tacoma, WA', open: 31 },
  { code: 'SCK', city: 'Stockton, CA', open: 9 },
  { code: 'IND', city: 'Indianapolis, IN', open: 27 },
];

export default function TabsOverflow() {
  return (
    <Tabs defaultValue="MEM">
      <TabList aria-label="Warehouses">
        {WAREHOUSES.map((warehouse) => (
          <Tab key={warehouse.code} value={warehouse.code}>
            {warehouse.city}
          </Tab>
        ))}
      </TabList>
      {WAREHOUSES.map((warehouse) => (
        <TabPanel key={warehouse.code} value={warehouse.code}>
          <Text size="sm">
            {warehouse.code}: {warehouse.open} open orders to ship today.
          </Text>
        </TabPanel>
      ))}
    </Tabs>
  );
}
