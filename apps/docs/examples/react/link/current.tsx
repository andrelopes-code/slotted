import { Inline } from '@slotted/react/inline';
import { Link } from '@slotted/react/link';

export default function LinkCurrent() {
  return (
    <nav aria-label="Workspace">
      <Inline gap={4}>
        <Link aria-current="page" href="#orders" underline="hover">
          Orders
        </Link>
        <Link href="#shipments" underline="hover">
          Shipments
        </Link>
        <Link href="#returns" underline="hover">
          Returns
        </Link>
        <Link href="#suppliers" underline="hover">
          Suppliers
        </Link>
      </Inline>
    </nav>
  );
}
