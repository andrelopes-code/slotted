import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Glyph, Icon } from '@slotted/react/icon';
import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { TextField } from '@slotted/react/text-field';
import { Heading, Text } from '@slotted/react/typography';

const PLAN = [
  ['Plan', 'Operations, annual'],
  ['Seats', '24 of 30 in use'],
  ['Next invoice', 'November 1, 2026: $4,320.00'],
];

export default function TabsSettings() {
  return (
    <Tabs defaultValue="workspace" orientation="vertical">
      <TabList aria-label="Settings">
        <Tab
          start={
            <Icon>
              <Glyph name="file-text" />
            </Icon>
          }
          value="workspace"
        >
          Workspace
        </Tab>
        <Tab
          start={
            <Icon>
              <Glyph name="bell" />
            </Icon>
          }
          value="notifications"
        >
          Notifications
        </Tab>
        <Tab
          start={
            <Icon>
              <Glyph name="lock" />
            </Icon>
          }
          value="security"
        >
          Security
        </Tab>
        <Tab
          start={
            <Icon>
              <Glyph name="calendar" />
            </Icon>
          }
          value="billing"
        >
          Billing
        </Tab>
      </TabList>
      <TabPanel value="workspace">
        <Stack gap={5} align="start">
          <Heading level={3} size="md">
            Workspace
          </Heading>
          <Field>
            <FieldLabel>Company name</FieldLabel>
            <TextField defaultValue="Northwind Traders" />
            <FieldDescription>Printed on every invoice and packing slip.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Support email</FieldLabel>
            <TextField defaultValue="support@northwind.example" type="email" />
          </Field>
          <Button size="sm">Save changes</Button>
        </Stack>
      </TabPanel>
      <TabPanel value="notifications">
        <Stack gap={4}>
          <Heading level={3} size="md">
            Notifications
          </Heading>
          <Switch defaultChecked>Low stock</Switch>
          <Switch defaultChecked>Late pickups</Switch>
          <Switch>Cycle count variances</Switch>
        </Stack>
      </TabPanel>
      <TabPanel value="security">
        <Stack gap={4}>
          <Heading level={3} size="md">
            Security
          </Heading>
          <Switch defaultChecked>Require two-factor sign-in</Switch>
          <Text size="sm" tone="muted">
            Changed by Dana Whitfield on August 14.
          </Text>
        </Stack>
      </TabPanel>
      <TabPanel value="billing">
        <Stack gap={4}>
          <Heading level={3} size="md">
            Billing
          </Heading>
          <DescriptionList>
            {PLAN.map(([term, description]) => (
              <DescriptionListItem key={term}>
                <DescriptionListTerm>{term}</DescriptionListTerm>
                <DescriptionListDescription>{description}</DescriptionListDescription>
              </DescriptionListItem>
            ))}
          </DescriptionList>
        </Stack>
      </TabPanel>
    </Tabs>
  );
}
