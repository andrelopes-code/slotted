import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

export default function TabsDisabled() {
  return (
    <Stack gap={8}>
      <Tabs defaultValue="summary">
        <TabList aria-label="Order SO-1192">
          <Tab value="summary">Summary</Tab>
          <Tab value="items">Items</Tab>
          <Tab disabled value="invoice">
            Invoice
          </Tab>
        </TabList>
        <TabPanel value="summary">
          <Text size="sm">Awaiting pickup. The invoice is issued once the order ships.</Text>
        </TabPanel>
        <TabPanel value="items">
          <Text size="sm">5 items from the Reno, NV warehouse.</Text>
        </TabPanel>
        <TabPanel value="invoice">
          <Text size="sm">Invoice INV-20931.</Text>
        </TabPanel>
      </Tabs>
      <Tabs defaultValue="summary" disabled>
        <TabList aria-label="Order SO-1188">
          <Tab value="summary">Summary</Tab>
          <Tab value="items">Items</Tab>
          <Tab value="invoice">Invoice</Tab>
        </TabList>
        <TabPanel value="summary">
          <Text size="sm">Locked while the warehouse recounts this order.</Text>
        </TabPanel>
        <TabPanel value="items">
          <Text size="sm">2 items from the Columbus, OH warehouse.</Text>
        </TabPanel>
        <TabPanel value="invoice">
          <Text size="sm">Invoice INV-20917.</Text>
        </TabPanel>
      </Tabs>
    </Stack>
  );
}
