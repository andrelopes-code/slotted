import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function VisuallyHiddenBasic() {
  return (
    <Inline>
      <Button tone="danger" variant="outline">
        <Glyph name="trash" />
        <VisuallyHidden>Delete invoice INV-20418</VisuallyHidden>
      </Button>
    </Inline>
  );
}
