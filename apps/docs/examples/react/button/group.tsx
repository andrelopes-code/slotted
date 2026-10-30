import { Button, IconButton } from '@slotted/react/button';
import { ButtonGroup } from '@slotted/react/button-group';
import { Glyph } from '@slotted/react/icon';

export default function ButtonGroupExample() {
  return (
    <ButtonGroup aria-label="Invoice actions" tone="secondary" variant="outline">
      <Button>Edit</Button>
      <Button>Duplicate</Button>
      <Button>Send</Button>
      <IconButton aria-label="More invoice actions">
        <Glyph name="ellipsis" />
      </IconButton>
    </ButtonGroup>
  );
}
