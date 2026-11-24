import { Button } from '@slotted/react/button';
import { Link } from '@slotted/react/link';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateFooter,
  ResultStateTitle,
} from '@slotted/react/result-state';

export default function ResultStateActionsExample() {
  return (
    <ResultState status="error">
      <ResultStateContent>
        <ResultStateTitle>Carrier rates did not load</ResultStateTitle>
        <ResultStateDescription>
          The rate service timed out, so shipping costs are not shown. Your cart is unchanged.
        </ResultStateDescription>
      </ResultStateContent>
      <ResultStateActions>
        <Button>Try again</Button>
        <Button variant="outline">Use flat rate</Button>
      </ResultStateActions>
      <ResultStateFooter>
        <Link href="#retries">How retries are counted</Link>
      </ResultStateFooter>
    </ResultState>
  );
}
