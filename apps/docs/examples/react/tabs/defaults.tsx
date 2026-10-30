import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs, TabsDefaultsProvider } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

export default function TabsDefaults() {
  return (
    <TabsDefaultsProvider size="sm" variant="contained">
      <Stack gap={8}>
        <Tabs defaultValue="stock">
          <TabList aria-label="Product OAK-90">
            <Tab value="stock">Stock</Tab>
            <Tab value="pricing">Pricing</Tab>
          </TabList>
          <TabPanel value="stock">
            <Text size="sm">1,284 units on hand.</Text>
          </TabPanel>
          <TabPanel value="pricing">
            <Text size="sm">List price $180.00, cost $96.40.</Text>
          </TabPanel>
        </Tabs>
        <Tabs defaultValue="open" variant="line">
          <TabList aria-label="Purchase orders">
            <Tab value="open">Open</Tab>
            <Tab value="received">Received</Tab>
          </TabList>
          <TabPanel value="open">
            <Text size="sm">3 purchase orders for OAK-90 are open.</Text>
          </TabPanel>
          <TabPanel value="received">
            <Text size="sm">Last received on September 22: 400 units.</Text>
          </TabPanel>
        </Tabs>
      </Stack>
    </TabsDefaultsProvider>
  );
}
