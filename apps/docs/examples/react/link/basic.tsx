import { Link } from '@slotted/react/link';
import { Text } from '@slotted/react/typography';

export default function LinkBasic() {
  return (
    <Text>
      Payment is due 30 days after the invoice date. Read the{' '}
      <Link href="#terms">terms of service</Link> before you confirm the order.
    </Text>
  );
}
