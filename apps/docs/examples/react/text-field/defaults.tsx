import { Grid } from '@slotted/react/grid';
import { TextField, TextFieldDefaultsProvider } from '@slotted/react/text-field';

export default function TextFieldDefaults() {
  return (
    <TextFieldDefaultsProvider size="sm" variant="subtle">
      <Grid gap={2} minItemWidth="xs">
        <TextField aria-label="Customer" clearable placeholder="Customer" />
        <TextField aria-label="Order number" mono placeholder="Order number" />
        <TextField aria-label="Ship to city" placeholder="Ship to city" />
      </Grid>
    </TextFieldDefaultsProvider>
  );
}
