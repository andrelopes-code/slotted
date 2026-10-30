import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const VIEWS = [
  { value: 'summary', label: 'Summary', panel: 'Harbor & Pine, $1,240.00, Net 30.' },
  { value: 'items', label: 'Items', panel: '3 lines: shelves, brackets and an assembly kit.' },
  { value: 'shipments', label: 'Shipments', panel: 'Atlas Freight, expected September 12.' },
];

export default function TabsLinks() {
  return (
    <Tabs defaultValue="summary">
      <TabList aria-label="Order SO-1187">
        {VIEWS.map((view) => (
          <Tab key={view.value} href={`#order-${view.value}`} value={view.value}>
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
  );
}
