import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';

export default function ButtonVariants() {
  return (
    <Inline gap={2}>
      <Button>Publish invoice</Button>
      <Button tone="secondary" variant="outline">
        Save draft
      </Button>
      <Button tone="secondary" variant="ghost">
        Discard
      </Button>
    </Inline>
  );
}
