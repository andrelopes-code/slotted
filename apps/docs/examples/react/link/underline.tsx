import { Inline } from '@slotted/react/inline';
import { Link } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function LinkUnderline() {
  return (
    <Stack gap={3}>
      <Inline gap={3}>
        <Text size="sm" tone="muted">
          always
        </Text>
        <Link href="#register">Invoice register</Link>
      </Inline>
      <Inline gap={3}>
        <Text size="sm" tone="muted">
          hover
        </Text>
        <Link href="#payments" underline="hover">
          Payment runs
        </Link>
      </Inline>
      <Inline gap={3}>
        <Text size="sm" tone="muted">
          none
        </Text>
        <Link href="#suppliers" underline="none">
          Supplier directory
        </Link>
      </Inline>
    </Stack>
  );
}
