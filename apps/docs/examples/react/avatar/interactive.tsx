import { Avatar } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';

export default function AvatarInteractive() {
  return (
    <Inline align="center" gap={4}>
      <Avatar name="Maria Chen" render={(props) => <a {...props} href="#maria-chen" />} size="lg" />
      <Avatar
        name="Tomas Reyes"
        render={(props) => <button {...props} type="button" />}
        size="lg"
      />
      <Avatar
        name="Priya Raman"
        render={(props) => <a {...props} href="#priya-raman" />}
        size="xs"
      />
      <Avatar
        disabled
        name="Samuel Okafor"
        render={(props) => <button {...props} disabled type="button" />}
        size="lg"
      />
    </Inline>
  );
}
