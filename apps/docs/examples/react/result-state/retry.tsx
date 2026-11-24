import { useEffect, useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';

type Phase = 'failed' | 'retrying' | 'loaded';

export default function ResultStateRetry() {
  const [phase, setPhase] = useState<Phase>('failed');

  useEffect(() => {
    if (phase !== 'retrying') return;
    const timer = setTimeout(() => setPhase('loaded'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <ResultState status={phase === 'loaded' ? 'success' : 'error'}>
      <ResultStateContent>
        <ResultStateTitle>
          {phase === 'loaded' ? 'Carrier rates loaded' : 'Carrier rates did not load'}
        </ResultStateTitle>
        <ResultStateDescription>
          {phase === 'loaded'
            ? 'Showing 14 shipping options for 3 packages.'
            : 'The rate service timed out. Your cart is unchanged.'}
        </ResultStateDescription>
      </ResultStateContent>
      {phase !== 'loaded' && (
        <ResultStateActions>
          <Button loading={phase === 'retrying'} onClick={() => setPhase('retrying')}>
            Try again
          </Button>
        </ResultStateActions>
      )}
    </ResultState>
  );
}
