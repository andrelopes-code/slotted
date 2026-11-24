import { Inline } from '@slotted/react/inline';
import { Link } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function LinkSizes() {
  return (
    <Stack gap={3}>
      <Inline align="baseline" gap={4}>
        <Link href="#orders" size="xs">
          Orders
        </Link>
        <Link href="#shipments" size="sm">
          Shipments
        </Link>
        <Link href="#returns" size="md">
          Returns
        </Link>
      </Inline>
      <Text size="lg">
        Without a size, a link takes the text around it:{' '}
        <Link href="#forecast">open the demand forecast</Link>.
      </Text>
    </Stack>
  );
}
