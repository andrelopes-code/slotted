import { Stack } from '@slotted/react/stack';
import {
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type TabsTrack,
  type TabsVariant,
} from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const LOOKS: { variant: TabsVariant; track: TabsTrack }[] = [
  { variant: 'line', track: 'line' },
  { variant: 'contained', track: 'line' },
  { variant: 'line', track: 'none' },
];

const QUEUES = [
  { value: 'incoming', label: 'Incoming', panel: '14 purchase orders due this week.' },
  { value: 'outgoing', label: 'Outgoing', panel: '32 sales orders ready to ship.' },
  { value: 'returns', label: 'Returns', panel: '3 returns awaiting inspection.' },
];

export default function TabsVariants() {
  return (
    <Stack gap={8}>
      {LOOKS.map((look) => (
        <Tabs
          key={`${look.variant}-${look.track}`}
          defaultValue="incoming"
          track={look.track}
          variant={look.variant}
        >
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
      ))}
    </Stack>
  );
}
