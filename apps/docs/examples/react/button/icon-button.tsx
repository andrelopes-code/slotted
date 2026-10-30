import { IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function ButtonIconButton() {
  return (
    <Inline align="center" gap={2}>
      <IconButton aria-label="Copy invoice number">
        <Glyph name="copy" />
      </IconButton>
      <IconButton aria-label="Refresh balances" variant="outline">
        <Glyph name="rotate-ccw" />
      </IconButton>
      <IconButton aria-label="Delete draft" tone="danger">
        <Glyph name="trash" />
      </IconButton>
      <IconButton aria-label="Add note" shape="circle" tone="accent" variant="solid">
        <Glyph name="plus" />
      </IconButton>
    </Inline>
  );
}
