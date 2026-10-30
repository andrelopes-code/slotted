import { ButtonLink } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function ButtonLinkExample() {
  return (
    <Inline gap={2}>
      <ButtonLink end={<Glyph name="chevron-right" />} href="/invoices/INV-2041">
        View invoice
      </ButtonLink>
      <ButtonLink disabled href="/statements/2026-09.pdf" tone="secondary" variant="outline">
        Download statement
      </ButtonLink>
    </Inline>
  );
}
