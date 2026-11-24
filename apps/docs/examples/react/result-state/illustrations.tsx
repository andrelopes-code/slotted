import { Glyph, Icon } from '@slotted/react/icon';
import { Grid } from '@slotted/react/grid';
import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function ResultStateIllustrations() {
  return (
    <Grid columns={2} gap={6} minItemWidth="xs">
      <Stack gap={1}>
        <Text size="sm" tone="muted">
          tile
        </Text>
        <ResultState
          illustration="tile"
          media={
            <Icon>
              <Glyph name="bell" />
            </Icon>
          }
        >
          <ResultStateContent>
            <ResultStateTitle>No alerts configured</ResultStateTitle>
            <ResultStateDescription>Alerts tell you when stock runs low.</ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          stack
        </Text>
        <ResultState
          illustration="stack"
          media={
            <Icon>
              <Glyph name="inbox" />
            </Icon>
          }
        >
          <ResultStateContent>
            <ResultStateTitle>Inbox is clear</ResultStateTitle>
            <ResultStateDescription>No supplier messages are waiting.</ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          cards
        </Text>
        <ResultState
          illustration="cards"
          media={
            <Icon>
              <Glyph name="file-text" />
            </Icon>
          }
        >
          <ResultStateContent>
            <ResultStateTitle>No documents attached</ResultStateTitle>
            <ResultStateDescription>Attach packing slips or customs forms.</ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>

      <Stack gap={1}>
        <Text size="sm" tone="muted">
          cards, no glyph
        </Text>
        <ResultState illustration="cards">
          <ResultStateContent>
            <ResultStateTitle>No rows to show</ResultStateTitle>
            <ResultStateDescription>Import a file to fill this table.</ResultStateDescription>
          </ResultStateContent>
        </ResultState>
      </Stack>
    </Grid>
  );
}
