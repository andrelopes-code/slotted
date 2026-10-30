import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Grid } from '@slotted/react/grid';

export default function CheckboxGroupTiles() {
  return (
    <FieldGroup>
      <FieldGroupLegend>Add-ons</FieldGroupLegend>
      <FieldGroupContent>
        <CheckboxGroup name="add-ons" variant="tile" defaultValue={['audit-log']}>
          <Grid minItemWidth="xs">
            <Checkbox value="audit-log" description="$29 per month. Every change kept for a year.">
              Audit log
            </Checkbox>
            <Checkbox value="sso" description="$49 per month. SAML and SCIM provisioning.">
              Single sign-on
            </Checkbox>
            <Checkbox value="support" description="$99 per month. Replies within four hours.">
              Priority support
            </Checkbox>
          </Grid>
        </CheckboxGroup>
      </FieldGroupContent>
    </FieldGroup>
  );
}
