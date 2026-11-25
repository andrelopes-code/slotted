import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { PickerTrigger } from './picker-trigger';
import type { PickerLayer } from './use-picker-layer';

interface PickerFrameProps {
  readonly clearLabel: string;
  readonly editable: boolean;
  readonly glyph: 'calendar' | 'clock';
  readonly layer: PickerLayer;
  readonly onClear: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  readonly placeholder: string;
  /** What a plain form posts: the two ends, under their own names. */
  readonly posted: Readonly<Record<'end' | 'start', { name: string | undefined; value: string }>>;
  readonly spoken: string;
  readonly summary: string | null;
}

/** A one-line frame: the run in words as the trigger, one clear, and what a form posts. */
export function PickerFrame(props: PickerFrameProps) {
  const { clearLabel, editable, glyph, layer, onClear, placeholder, posted, spoken, summary } =
    props;

  return (
    <div data-part="control" data-part-control="">
      <PickerTrigger disabled={!editable} glyph={glyph} label={spoken} layer={layer}>
        <span
          data-part="summary"
          data-part-summary=""
          {...(summary === null ? { 'data-placeholder': '' } : {})}
        >
          {summary ?? placeholder}
        </span>
      </PickerTrigger>

      {onClear !== undefined && (
        <button
          aria-label={clearLabel}
          data-part="clear"
          data-part-clear=""
          disabled={!editable}
          onClick={onClear}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      )}

      {(['start', 'end'] as const).map((position) => (
        <input
          data-part="hidden-input"
          data-part-hidden-input=""
          key={position}
          name={posted[position].name}
          type="hidden"
          value={posted[position].value}
        />
      ))}
    </div>
  );
}
