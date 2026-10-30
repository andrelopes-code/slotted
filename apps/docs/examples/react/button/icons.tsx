import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function ButtonIcons() {
  return (
    <Inline gap={2}>
      <Button start={<Glyph name="plus" />}>New order</Button>
      <Button start={<Glyph name="upload" />} tone="secondary" variant="outline">
        Import CSV
      </Button>
      <Button end={<Glyph name="chevron-right" />} tone="secondary" variant="ghost">
        Continue to payment
      </Button>
    </Inline>
  );
}
