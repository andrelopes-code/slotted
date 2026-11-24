import { Link, LinkDefaultsProvider } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';

export default function LinkApplicationDefaults() {
  return (
    <LinkDefaultsProvider underline="hover" variant="neutral">
      <Stack gap={2}>
        <Link href="#inv-0041">INV-2026-08-0041</Link>
        <Link href="#inv-0042">INV-2026-08-0042</Link>
        <Link href="#inv-0043">INV-2026-08-0043</Link>
        <Link href="#register" underline="always" variant="accent">
          Open the invoice register
        </Link>
      </Stack>
    </LinkDefaultsProvider>
  );
}
