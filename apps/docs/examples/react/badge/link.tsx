import { Badge } from '@slotted/react/badge';

export default function BadgeLink() {
  return (
    <Badge
      render={(props) => <a {...props} href="#backordered" />}
      tone="warning"
      variant="outline"
    >
      Backordered
    </Badge>
  );
}
