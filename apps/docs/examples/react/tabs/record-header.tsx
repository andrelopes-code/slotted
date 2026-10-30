import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import { Glyph, Icon } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Heading, Text } from '@slotted/react/typography';

const FACTS = [
  ['Customer', 'Harbor & Pine'],
  ['Placed', 'September 8, 2026'],
  ['Payment terms', 'Net 30'],
  ['Ship to', '88 Dock Street, Portland, OR'],
  ['Carrier', 'Atlas Freight'],
  ['Total', '$1,240.00'],
];

const LINES = [
  { sku: 'OAK-90', item: 'Oak shelf, 90 cm', quantity: 4, amount: '$720.00' },
  { sku: 'BRK-ST', item: 'Wall bracket, steel', quantity: 8, amount: '$192.00' },
  { sku: 'KIT-AS', item: 'Assembly kit', quantity: 1, amount: '$328.00' },
];

const ACTIVITY = [
  'Sep 9, 14:02 — Picked at Reno, NV by Luis Ortega',
  'Sep 8, 16:45 — Payment approved',
  'Sep 8, 16:41 — Order placed by Dana Whitfield',
];

export default function TabsRecordHeader() {
  return (
    <Stack gap={6}>
      <Inline gap={4} align="start" justify="between" wrap="wrap">
        <Stack gap={1}>
          <Inline gap={3} align="center">
            <Heading level={2} size="xl">
              Order SO-1187
            </Heading>
            <Badge tone="warning">Awaiting pickup</Badge>
          </Inline>
          <Text size="sm" tone="muted">
            Harbor & Pine · Placed September 8, 2026
          </Text>
        </Stack>
        <Inline gap={2}>
          <Button size="sm" start={<Glyph name="file-text" />} tone="secondary" variant="outline">
            Packing slip
          </Button>
          <Button size="sm">Mark shipped</Button>
        </Inline>
      </Inline>
      <Tabs defaultValue="overview">
        <TabList aria-label="Order SO-1187">
          <Tab
            start={
              <Icon>
                <Glyph name="file-text" />
              </Icon>
            }
            value="overview"
          >
            Overview
          </Tab>
          <Tab
            end={<Badge count={LINES.length} size="sm" />}
            start={
              <Icon>
                <Glyph name="inbox" />
              </Icon>
            }
            value="items"
          >
            Items
          </Tab>
          <Tab
            end={<Badge count={ACTIVITY.length} size="sm" />}
            start={
              <Icon>
                <Glyph name="clock" />
              </Icon>
            }
            value="activity"
          >
            Activity
          </Tab>
        </TabList>
        <TabPanel value="overview">
          <DescriptionList columns={2}>
            {FACTS.map(([term, description]) => (
              <DescriptionListItem key={term}>
                <DescriptionListTerm>{term}</DescriptionListTerm>
                <DescriptionListDescription>{description}</DescriptionListDescription>
              </DescriptionListItem>
            ))}
          </DescriptionList>
        </TabPanel>
        <TabPanel value="items">
          <Table columns={4}>
            <TableContent aria-label="Order lines">
              <TableHead>
                <TableRow>
                  <TableColumnHeader>SKU</TableColumnHeader>
                  <TableColumnHeader>Item</TableColumnHeader>
                  <TableColumnHeader numeric>Quantity</TableColumnHeader>
                  <TableColumnHeader numeric>Amount</TableColumnHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {LINES.map((line) => (
                  <TableRow key={line.sku} value={line.sku}>
                    <TableRowHeader>{line.sku}</TableRowHeader>
                    <TableCell>{line.item}</TableCell>
                    <TableCell numeric>{line.quantity}</TableCell>
                    <TableCell numeric>{line.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContent>
          </Table>
        </TabPanel>
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
    </Stack>
  );
}
