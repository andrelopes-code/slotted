import { Button } from '@slotted/react/button';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Toolbar, ToolbarSeparator } from '@slotted/react/toolbar';

export default function ToggleGroupToolbar() {
  return (
    <Toolbar aria-label="Sales report">
      <ToggleGroup aria-label="Chart type" defaultValue={['bars']} variant="ghost">
        <ToggleGroupItem value="bars">Bars</ToggleGroupItem>
        <ToggleGroupItem value="lines">Lines</ToggleGroupItem>
      </ToggleGroup>
      <ToolbarSeparator />
      <ToggleGroup aria-label="Overlays" defaultValue={['forecast']} multiple variant="ghost">
        <ToggleGroupItem value="forecast">Forecast</ToggleGroupItem>
        <ToggleGroupItem value="prior-year">Prior year</ToggleGroupItem>
      </ToggleGroup>
      <ToolbarSeparator />
      <Button size="sm" tone="secondary" variant="ghost">
        Export
      </Button>
    </Toolbar>
  );
}
