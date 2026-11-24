import { Alert, AlertContent, AlertDescription } from '@slotted/react/alert';
import { Inline } from '@slotted/react/inline';
import { Link } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function LinkVariants() {
  return (
    <Stack gap={4}>
      <Text>
        Review the <Link href="#history">payment history</Link> before the due date.
      </Text>
      <Inline gap={3}>
        <Text size="sm" tone="muted">
          Invoice
        </Text>
        <Link href="#invoice" underline="hover" variant="neutral">
          INV-2026-08-0041
        </Link>
      </Inline>
      <Alert tone="accent" variant="solid">
        <AlertContent>
          <AlertDescription>
            Your trial ends in three days.{' '}
            <Link href="#plans" variant="inverse">
              Choose a plan
            </Link>
          </AlertDescription>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
