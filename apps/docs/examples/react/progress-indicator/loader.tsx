import { Inline } from '@slotted/react/inline';
import { Loader } from '@slotted/react/progress-indicator';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function ProgressIndicatorLoader() {
  return (
    <Stack align="start" gap={5}>
      <Loader label="Signing you in" />
      <Loader contained label="Checking warehouse access" size="lg" />
      <Inline align="center" gap={3}>
        <Loader decorative size="sm" />
        <Text size="sm">Importing contacts, 62% done.</Text>
      </Inline>
    </Stack>
  );
}
