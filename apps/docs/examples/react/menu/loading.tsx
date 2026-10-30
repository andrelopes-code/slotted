import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Menu, MenuCheckboxItem, MenuContent, MenuEmpty, MenuTrigger } from '@slotted/react/menu';

const LABELS = ['Fragile', 'Gift wrap', 'Priority', 'Wholesale'];

export default function MenuLoading() {
  const [labels, setLabels] = useState<string[] | null>(null);
  const requested = useRef(false);

  const load = (open: boolean) => {
    if (!open || requested.current) return;
    requested.current = true;
    setTimeout(() => setLabels(LABELS), 1200);
  };

  return (
    <Menu onOpenChange={load}>
      <MenuTrigger
        render={(props) => (
          <Button {...props} end={<Glyph name="chevron-down" />} variant="outline">
            Labels
          </Button>
        )}
      />
      <MenuContent loading={labels === null}>
        {labels === null ? (
          <MenuEmpty>Loading labels…</MenuEmpty>
        ) : (
          labels.map((label) => <MenuCheckboxItem key={label}>{label}</MenuCheckboxItem>)
        )}
      </MenuContent>
    </Menu>
  );
}
