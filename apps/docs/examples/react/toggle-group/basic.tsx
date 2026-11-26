import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';

export default function ToggleGroupBasic() {
  return (
    <ToggleGroup aria-label="Revenue period" defaultValue={['week']}>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
      <ToggleGroupItem value="quarter">Quarter</ToggleGroupItem>
    </ToggleGroup>
  );
}
