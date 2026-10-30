import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Tab, TabActions, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Toolbar } from '@slotted/react/toolbar';
import { Text } from '@slotted/react/typography';

const VIEWS = [
  { value: 'lines', label: 'Lines', panel: '6 lines from Quill & Co., $4,812.00.' },
  { value: 'receipts', label: 'Receipts', panel: '4 of 6 lines received at Columbus, OH.' },
  { value: 'history', label: 'History', panel: 'Approved by Marco Ilić on September 22.' },
];

export default function TabsActionsExample() {
  return (
    <Tabs defaultValue="lines">
      <TabList aria-label="Purchase order PO-4521">
        {VIEWS.map((view) => (
          <Tab key={view.value} value={view.value}>
            {view.label}
          </Tab>
        ))}
      </TabList>
      <TabActions>
        <Toolbar aria-label="Purchase order actions" size="sm">
          <Button size="sm" start={<Glyph name="upload" />} tone="secondary" variant="ghost">
            Export
          </Button>
          <Button size="sm" start={<Glyph name="copy" />} tone="secondary" variant="ghost">
            Duplicate
          </Button>
        </Toolbar>
      </TabActions>
      {VIEWS.map((view) => (
        <TabPanel key={view.value} value={view.value}>
          <Text size="sm">{view.panel}</Text>
        </TabPanel>
      ))}
    </Tabs>
  );
}
