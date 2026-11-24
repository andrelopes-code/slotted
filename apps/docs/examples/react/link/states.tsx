import { Link } from '@slotted/react/link';
import { Stack } from '@slotted/react/stack';

export default function LinkStates() {
  return (
    <Stack gap={3}>
      <Link href="#order-4821">Open order 4821</Link>
      <Link href="#order-4820" visited>
        Order 4820, in the visited color once followed
      </Link>
      <Link disabled href="#order-4822">
        Order 4822, available once it ships
      </Link>
    </Stack>
  );
}
