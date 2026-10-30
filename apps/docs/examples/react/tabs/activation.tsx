import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs, type TabsActivation } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const MODES: { activation: TabsActivation; caption: string }[] = [
  { activation: 'automatic', caption: 'Automatic: the arrow keys select as they move.' },
  { activation: 'manual', caption: 'Manual: the arrow keys move focus; Enter or Space selects.' },
];

const REPORTS = [
  { value: 'revenue', label: 'Revenue', panel: 'Revenue this quarter: $412,800.00.' },
  { value: 'margin', label: 'Margin', panel: 'Gross margin this quarter: 38.4%.' },
  { value: 'returns', label: 'Returns', panel: 'Return rate this quarter: 2.1%.' },
];

export default function TabsActivationExample() {
  return (
    <Stack gap={8}>
      {MODES.map((mode) => (
        <Stack key={mode.activation} gap={3}>
          <Text size="sm" tone="muted">
            {mode.caption}
          </Text>
          <Tabs activation={mode.activation} defaultValue="revenue">
            <TabList aria-label="Quarterly reports">
              {REPORTS.map((report) => (
                <Tab key={report.value} value={report.value}>
                  {report.label}
                </Tab>
              ))}
            </TabList>
            {REPORTS.map((report) => (
              <TabPanel key={report.value} value={report.value}>
                <Text size="sm">{report.panel}</Text>
              </TabPanel>
            ))}
          </Tabs>
        </Stack>
      ))}
    </Stack>
  );
}
