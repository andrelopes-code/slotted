import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs, type TabsMount } from '@slotted/react/tabs';
import { Textarea } from '@slotted/react/textarea';
import { Text } from '@slotted/react/typography';

const MODES: { mount: TabsMount; caption: string }[] = [
  { mount: 'active', caption: 'mount="active": the note is built again, empty, on return.' },
  { mount: 'lazy', caption: 'mount="lazy": the note keeps what was typed.' },
];

export default function TabsMountExample() {
  return (
    <Stack gap={8}>
      {MODES.map((mode) => (
        <Stack key={mode.mount} gap={3}>
          <Text size="sm" tone="muted">
            {mode.caption}
          </Text>
          <Tabs defaultValue="note" mount={mode.mount}>
            <TabList aria-label="Order SO-1187">
              <Tab value="note">Picking note</Tab>
              <Tab value="summary">Summary</Tab>
            </TabList>
            <TabPanel value="note">
              <Field>
                <FieldLabel>Note for the picker</FieldLabel>
                <Textarea placeholder="Pack the brackets separately" rows={2} />
              </Field>
            </TabPanel>
            <TabPanel value="summary">
              <Text size="sm">3 lines, picked from zone C at Reno, NV.</Text>
            </TabPanel>
          </Tabs>
        </Stack>
      ))}
    </Stack>
  );
}
