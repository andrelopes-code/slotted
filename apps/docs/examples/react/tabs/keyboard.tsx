import { useState } from 'react';
import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const STEPS = [
  { value: 'picking', label: 'Picking', panel: '18 lines to pick in zone C.' },
  { value: 'packing', label: 'Packing', panel: '6 orders waiting at station 2.' },
  { value: 'loading', label: 'Loading', panel: 'Atlas Freight trailer at dock 4 until 15:30.' },
];

export default function TabsKeyboard() {
  const [last, setLast] = useState('Nothing selected yet.');

  return (
    <Stack gap={5}>
      <Tabs
        defaultValue="picking"
        onValueChange={(value, request) => {
          const step = STEPS.find((item) => item.value === value);
          setLast(`${step?.label} selected by ${request.reason}.`);
        }}
      >
        <TabList aria-label="Outbound shift">
          {STEPS.map((step) => (
            <Tab key={step.value} value={step.value}>
              {step.label}
            </Tab>
          ))}
        </TabList>
        {STEPS.map((step) => (
          <TabPanel key={step.value} value={step.value}>
            <Text size="sm">{step.panel}</Text>
          </TabPanel>
        ))}
      </Tabs>
      <Text size="sm" tone="muted">
        {last}
      </Text>
    </Stack>
  );
}
