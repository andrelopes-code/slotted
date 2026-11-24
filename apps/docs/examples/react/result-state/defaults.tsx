import {
  ResultState,
  ResultStateContent,
  ResultStateDefaultsProvider,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import { Stack } from '@slotted/react/stack';

export default function ResultStateDefaults() {
  return (
    <ResultStateDefaultsProvider align="start" reach="inline">
      <Stack gap={6}>
        <ResultState status="empty">
          <ResultStateContent>
            <ResultStateTitle>No late shipments</ResultStateTitle>
            <ResultStateDescription>
              Every carrier picked up on time this week.
            </ResultStateDescription>
          </ResultStateContent>
        </ResultState>

        <ResultState status="no-results">
          <ResultStateContent>
            <ResultStateTitle>No returns in this period</ResultStateTitle>
            <ResultStateDescription>
              Widen the date range to see earlier returns.
            </ResultStateDescription>
          </ResultStateContent>
        </ResultState>

        <ResultState align="center" reach="section" status="error">
          <ResultStateContent>
            <ResultStateTitle>Inventory counts did not load</ResultStateTitle>
            <ResultStateDescription>
              This region sets its own reach and alignment.
            </ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>
    </ResultStateDefaultsProvider>
  );
}
