import { Button } from '@slotted/react/button';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function ResultStateAlign() {
  return (
    <Stack gap={8}>
      <Stack gap={1}>
        <Text size="sm" tone="muted">
          center
        </Text>
        <ResultState align="center">
          <ResultStateContent>
            <ResultStateTitle>No saved reports</ResultStateTitle>
            <ResultStateDescription>
              Save a report to run it again in one click.
            </ResultStateDescription>
          </ResultStateContent>
          <ResultStateActions>
            <Button>Save a report</Button>
          </ResultStateActions>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          start
        </Text>
        <ResultState align="start">
          <ResultStateContent>
            <ResultStateTitle>No saved reports</ResultStateTitle>
            <ResultStateDescription>
              Save a report to run it again in one click.
            </ResultStateDescription>
          </ResultStateContent>
          <ResultStateActions>
            <Button>Save a report</Button>
          </ResultStateActions>
        </ResultState>
      </Stack>
    </Stack>
  );
}
