import { Checkbox } from '@slotted/react/checkbox';
import { Grid } from '@slotted/react/grid';

export default function CheckboxTile() {
  return (
    <Grid gap={4} minItemWidth="sm">
      <Checkbox variant="tile" defaultChecked description="One copy a day, kept for 30 days.">
        Daily backup
      </Checkbox>
      <Checkbox variant="tile" description="Who changed what, and when, exported as CSV.">
        Audit log
      </Checkbox>
      <Checkbox variant="tile" disabled description="Available on the Scale plan.">
        Secondary region
      </Checkbox>
    </Grid>
  );
}
