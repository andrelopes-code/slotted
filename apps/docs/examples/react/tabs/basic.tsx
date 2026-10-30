import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const SECTIONS = [
  {
    value: 'summary',
    label: 'Summary',
    pairs: [
      ['Customer', 'Harbor & Pine'],
      ['Placed', 'September 8, 2026'],
      ['Payment terms', 'Net 30'],
      ['Total', '$1,240.00'],
    ],
  },
  {
    value: 'items',
    label: 'Items',
    pairs: [
      ['Oak shelf, 90 cm', '4 × $180.00'],
      ['Wall bracket, steel', '8 × $24.00'],
      ['Assembly kit', '1 × $328.00'],
    ],
  },
  {
    value: 'shipments',
    label: 'Shipments',
    pairs: [
      ['Carrier', 'Atlas Freight'],
      ['Tracking', 'AF-2210-4471'],
      ['Expected', 'September 12, 2026'],
    ],
  },
];

const ACTIVITY = [
  'Sep 9, 14:02 — Picked at Reno, NV',
  'Sep 8, 16:45 — Payment approved',
  'Sep 8, 16:41 — Order placed by Dana Whitfield',
];

export default function TabsBasic() {
  return (
    <Tabs defaultValue="summary">
      <TabList aria-label="Order SO-1187">
        {SECTIONS.map((section) => (
          <Tab key={section.value} value={section.value}>
            {section.label}
          </Tab>
        ))}
        <Tab value="activity">Activity</Tab>
      </TabList>
      {SECTIONS.map((section) => (
        <TabPanel key={section.value} value={section.value}>
          <DescriptionList>
            {section.pairs.map(([term, description]) => (
              <DescriptionListItem key={term}>
                <DescriptionListTerm>{term}</DescriptionListTerm>
                <DescriptionListDescription>{description}</DescriptionListDescription>
              </DescriptionListItem>
            ))}
          </DescriptionList>
        </TabPanel>
      ))}
      <TabPanel value="activity">
        <Stack gap={2}>
          {ACTIVITY.map((entry) => (
            <Text key={entry} size="sm">
              {entry}
            </Text>
          ))}
        </Stack>
      </TabPanel>
    </Tabs>
  );
}
