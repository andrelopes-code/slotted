import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function ResultStateLive() {
  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Text size="sm" tone="muted">
          polite: role status
        </Text>
        <ResultState align="start" live="polite" reach="inline" status="no-results">
          <ResultStateContent>
            <ResultStateTitle>No orders match this search</ResultStateTitle>
            <ResultStateDescription>
              Check the spelling or search by order number.
            </ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          assertive: role alert
        </Text>
        <ResultState align="start" live="assertive" reach="inline" status="error">
          <ResultStateContent>
            <ResultStateTitle>Payment was declined</ResultStateTitle>
            <ResultStateDescription>Use another card to complete the order.</ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          off: no role
        </Text>
        <ResultState align="start" live="off" reach="inline">
          <ResultStateContent>
            <ResultStateTitle>No drafts</ResultStateTitle>
            <ResultStateDescription>
              A live region on this screen announces changes.
            </ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>
    </Stack>
  );
}
