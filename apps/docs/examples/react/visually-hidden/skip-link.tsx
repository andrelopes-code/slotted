import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function VisuallyHiddenSkipLink() {
  return (
    <Stack gap={3}>
      <VisuallyHidden focusable render={(props) => <a {...props} href="#orders-today" />}>
        Skip to the orders
      </VisuallyHidden>
      <Text size="sm" tone="muted">
        The skip link appears above this text while it has focus.
      </Text>
      <Heading id="orders-today" level={2} size="sm" tabIndex={-1}>
        Orders placed today
      </Heading>
    </Stack>
  );
}
