import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const SECTIONS = [
  {
    value: 'general',
    label: 'General',
    lines: ['Code: RNO', 'Address: 1450 Terminal Way, Reno, NV 89502', 'Time zone: Pacific Time'],
  },
  {
    value: 'receiving',
    label: 'Receiving',
    lines: ['Dock hours: 06:00–14:00, Monday to Friday', 'Appointment required for full trucks'],
  },
  {
    value: 'shipping',
    label: 'Shipping',
    lines: ['Carriers: Atlas Freight, Ridgeway Parcel', 'Daily cut-off: 15:30'],
  },
  {
    value: 'storage',
    label: 'Storage',
    lines: ['Zones: A–F, 1,920 bin locations', 'Cycle count: every 30 days'],
  },
];

export default function TabsVertical() {
  return (
    <Tabs defaultValue="general" orientation="vertical">
      <TabList aria-label="Warehouse settings">
        {SECTIONS.map((section) => (
          <Tab key={section.value} value={section.value}>
            {section.label}
          </Tab>
        ))}
      </TabList>
      {SECTIONS.map((section) => (
        <TabPanel key={section.value} value={section.value}>
          <Stack gap={2}>
            {section.lines.map((line) => (
              <Text key={line} size="sm">
                {line}
              </Text>
            ))}
          </Stack>
        </TabPanel>
      ))}
    </Tabs>
  );
}
