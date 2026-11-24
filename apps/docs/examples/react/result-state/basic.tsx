import { Button } from '@slotted/react/button';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';

export default function ResultStateBasic() {
  return (
    <ResultState>
      <ResultStateContent>
        <ResultStateTitle>No purchase orders yet</ResultStateTitle>
        <ResultStateDescription>
          Create the first order to start tracking what you buy from suppliers.
        </ResultStateDescription>
      </ResultStateContent>
      <ResultStateActions>
        <Button>Create purchase order</Button>
      </ResultStateActions>
    </ResultState>
  );
}
