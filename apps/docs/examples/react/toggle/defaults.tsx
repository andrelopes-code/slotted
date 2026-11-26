import { Inline } from '@slotted/react/inline';
import { Toggle, ToggleDefaultsProvider } from '@slotted/react/toggle';

export default function ToggleDefaults() {
  return (
    <ToggleDefaultsProvider size="sm" variant="chips">
      <Inline gap={2}>
        <Toggle defaultPressed>Late pickups</Toggle>
        <Toggle>Low stock</Toggle>
        <Toggle>Backordered</Toggle>
        <Toggle variant="ghost">Archived</Toggle>
      </Inline>
    </ToggleDefaultsProvider>
  );
}
