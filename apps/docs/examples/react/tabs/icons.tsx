import { Badge } from '@slotted/react/badge';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const VIEWS: { value: string; label: string; icon: GlyphName; count?: number; panel: string }[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: 'file-text',
    panel: 'Harbor & Pine, customer since 2021. Net 30 terms.',
  },
  {
    value: 'orders',
    label: 'Orders',
    icon: 'inbox',
    count: 12,
    panel: '12 open orders, $14,380.00 in total.',
  },
  {
    value: 'contacts',
    label: 'Contacts',
    icon: 'person',
    count: 3,
    panel: 'Dana Whitfield, Marco Ilić and Priya Raman.',
  },
  {
    value: 'files',
    label: 'Files',
    icon: 'paperclip',
    panel: 'Signed credit application and a W-9 form.',
  },
];

export default function TabsIcons() {
  return (
    <Tabs defaultValue="orders">
      <TabList aria-label="Customer Harbor & Pine">
        {VIEWS.map((view) => (
          <Tab
            key={view.value}
            value={view.value}
            start={
              <Icon>
                <Glyph name={view.icon} />
              </Icon>
            }
            end={view.count === undefined ? undefined : <Badge count={view.count} size="sm" />}
          >
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
