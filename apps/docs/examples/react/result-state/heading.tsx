import { Button } from '@slotted/react/button';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';

export default function ResultStateHeading() {
  return (
    <ResultState reach="page" status="not-found">
      <ResultStateContent>
        <ResultStateTitle render={(props) => <h1 {...props} />}>Order not found</ResultStateTitle>
        <ResultStateDescription>
          Nothing exists at /orders/SO-10492-REV3. The order may have been deleted or merged.
        </ResultStateDescription>
      </ResultStateContent>
      <ResultStateActions>
        <Button>Back to orders</Button>
      </ResultStateActions>
    </ResultState>
  );
}
