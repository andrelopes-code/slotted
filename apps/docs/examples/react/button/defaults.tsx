import { Button, ButtonDefaultsProvider } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function ButtonDefaults() {
  return (
    <ButtonDefaultsProvider size="sm" tone="secondary" variant="outline">
      <Inline gap={2}>
        <Button start={<Glyph name="funnel" />}>Filter</Button>
        <Button>Columns</Button>
        <Button>Export</Button>
        <Button start={<Glyph name="plus" />} tone="accent" variant="solid">
          New order
        </Button>
      </Inline>
    </ButtonDefaultsProvider>
  );
}
