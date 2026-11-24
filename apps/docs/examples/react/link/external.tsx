import { Link } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';

export default function LinkExternal() {
  return (
    <Stack gap={3}>
      <Link external href="https://example.com/carriers/northwind-freight">
        Carrier tracking page
      </Link>
      <Link href="https://example.com/status" target="_blank">
        Carrier service status
      </Link>
      <Link
        external
        href="https://example.com/customs/guide"
        messages={{ externalHint: '(opens in a new window)' }}
      >
        Customs documentation guide
      </Link>
    </Stack>
  );
}
