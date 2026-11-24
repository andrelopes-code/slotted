import { Button } from '@slotted/react/button';
import { Link } from '@slotted/react/link';
import { Text } from '@slotted/react/typography';

export default function LinkAction() {
  return (
    <Text>
      Invoice INV-2026-08-0041 was sent to the buyer on September 3.{' '}
      <Link href="#invoice">View the invoice</Link> or <Button inline>send it again</Button>.
    </Text>
  );
}
