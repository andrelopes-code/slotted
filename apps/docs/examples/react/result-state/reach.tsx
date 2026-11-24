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

export default function ResultStateReach() {
  return (
    <Stack gap={8}>
      <Stack gap={1}>
        <Text size="sm" tone="muted">
          inline
        </Text>
        <ResultState reach="inline" status="no-results">
          <ResultStateContent>
            <ResultStateTitle>No rows match the filter</ResultStateTitle>
          </ResultStateContent>
          <ResultStateActions>
            <Button size="sm" variant="ghost">
              Clear filters
            </Button>
          </ResultStateActions>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          section
        </Text>
        <ResultState reach="section" status="empty">
          <ResultStateContent>
            <ResultStateTitle>No open invoices</ResultStateTitle>
            <ResultStateDescription>
              Invoices appear here when an order ships and stay until they are paid.
            </ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          page
        </Text>
        <ResultState reach="page" status="not-found">
          <ResultStateContent>
            <ResultStateTitle>Page not found</ResultStateTitle>
            <ResultStateDescription>
              The page you opened does not exist or has moved.
            </ResultStateDescription>
          </ResultStateContent>
          <ResultStateActions>
            <Button>Go to the dashboard</Button>
          </ResultStateActions>
        </ResultState>
      </Stack>
    </Stack>
  );
}
