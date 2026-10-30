import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Grid } from '@slotted/react/grid';
import { Radio, RadioGroup } from '@slotted/react/radio-group';

export default function RadioGroupTiles() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Plan</FieldGroupLegend>
      <FieldGroupContent>
        <RadioGroup name="plan" variant="tile" defaultValue="team">
          <Grid minItemWidth="xs">
            <Radio value="starter" description="$0 per month. Three projects and one seat.">
              Starter
            </Radio>
            <Radio value="team" description="$49 per month. Unlimited projects and ten seats.">
              Team
            </Radio>
            <Radio value="business" description="$199 per month. Single sign-on and audit logs.">
              Business
            </Radio>
          </Grid>
        </RadioGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
