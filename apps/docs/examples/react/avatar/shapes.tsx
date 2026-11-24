import { Avatar } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';

export default function AvatarShapes() {
  return (
    <Inline align="center" gap={4}>
      <Avatar name="Maria Chen" shape="circle" size="lg" />
      <Avatar name="Night shift" shape="square" size="lg" />
      <Avatar name="Northwind Logistics" shape="square" size="lg" />
      <Avatar name="Replenishment bot" shape="square" size="lg" />
    </Inline>
  );
}
