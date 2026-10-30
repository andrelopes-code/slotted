import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const QUEUES = [
  { value: 'incoming', label: 'Incoming', panel: '14 purchase orders due this week.' },
  { value: 'outgoing', label: 'Outgoing', panel: '32 sales orders ready to ship.' },
  {
    value: 'inspection',
    label: 'Awaiting inspection',
    panel: '3 returns wait for a quality check before restocking.',
  },
];

export default function TabsFit() {
  return (
    <Tabs defaultValue="incoming" fit="equal" variant="contained">
      <TabList aria-label="Warehouse queues">
        {QUEUES.map((queue) => (
          <Tab key={queue.value} value={queue.value}>
            {queue.label}
          </Tab>
        ))}
      </TabList>
      {QUEUES.map((queue) => (
        <TabPanel key={queue.value} value={queue.value}>
          <Text size="sm">{queue.panel}</Text>
        </TabPanel>
      ))}
    </Tabs>
  );
}
