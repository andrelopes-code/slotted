import { Button } from '@slotted/react/button';
import { Glyph, Icon } from '@slotted/react/icon';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';

export default function ResultStateMedia() {
  return (
    <ResultState
      media={
        <Icon>
          <Glyph name="cloud-off" />
        </Icon>
      }
      status="offline"
    >
      <ResultStateContent>
        <ResultStateTitle>You are offline</ResultStateTitle>
        <ResultStateDescription>
          Scans are saved on this scanner and upload when the connection returns.
        </ResultStateDescription>
      </ResultStateContent>
      <ResultStateActions>
        <Button variant="outline">Check connection</Button>
      </ResultStateActions>
    </ResultState>
  );
}
