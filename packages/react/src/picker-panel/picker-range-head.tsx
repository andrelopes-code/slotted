import { pickerPanelMessages } from '@slotted/core/i18n';
import { useId } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { useMessages } from '../i18n';
import { PickerStep } from './picker-step';

/** One end of a run. */
export interface PickerHalfView {
  readonly current: boolean;
  readonly empty: boolean;
  readonly invalid?: boolean | undefined;
  readonly label: string;
  readonly meta: string;
  /** Pressing or focusing anywhere in the half makes it the end being chosen. */
  readonly onEnter: () => void;
  readonly value: ReactNode;
}

/** The length of a run, as a control. */
export interface PickerSpanView {
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
  readonly empty: boolean;
  readonly onStep: (direction: 1 | -1, event: MouseEvent<HTMLButtonElement>) => void;
  readonly text: string;
}

interface PickerRangeHeadProps {
  readonly end: PickerHalfView;
  readonly span: PickerSpanView;
  readonly start: PickerHalfView;
}

interface PickerHalfButtonProps {
  readonly children: ReactNode;
  readonly current?: boolean;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly part: 'day' | 'time';
}

/** The two ends of a run, and its length between them. */
export function PickerRangeHead({ end, span, start }: PickerRangeHeadProps) {
  const t = useMessages(pickerPanelMessages);

  return (
    <div data-part="range-head" data-part-range-head="">
      <PickerHalf half={start} />

      <div data-part="span" data-part-span="">
        <PickerStep
          direction="decrease"
          disabled={!span.canDecrease}
          label={t('decrease')}
          onClick={(event) => span.onStep(-1, event)}
        />
        <span
          data-part="span-text"
          data-part-span-text=""
          role="status"
          {...(span.empty ? { 'data-empty': '' } : {})}
        >
          {span.text}
        </span>
        <PickerStep
          direction="increase"
          disabled={!span.canIncrease}
          label={t('increase')}
          onClick={(event) => span.onStep(1, event)}
        />
      </div>

      <PickerHalf half={end} />
    </div>
  );
}

/** The day or the time of one end, as a press that brings its grid. */
export function PickerHalfButton({
  children,
  current = false,
  onClick,
  part,
}: PickerHalfButtonProps) {
  return (
    <button
      {...{ [`data-part-half-${part}`]: '' }}
      data-part={`half-${part}`}
      onClick={onClick}
      type="button"
      {...(current ? { 'data-current': '' } : {})}
    >
      {children}
    </button>
  );
}

function PickerHalf({ half }: { readonly half: PickerHalfView }) {
  const id = useId();

  return (
    <div
      aria-labelledby={id}
      data-part="half"
      data-part-half=""
      onFocus={half.onEnter}
      onPointerDown={half.onEnter}
      role="group"
      {...(half.current ? { 'data-current': '' } : {})}
    >
      <span data-part="half-label" data-part-half-label="" id={id}>
        {half.label}
      </span>
      <span data-part="half-meta" data-part-half-meta="">
        {half.meta}
      </span>
      <span
        data-part="half-value"
        data-part-half-value=""
        {...(half.empty ? { 'data-empty': '' } : {})}
        {...(half.invalid === true ? { 'data-invalid': '' } : {})}
      >
        {half.value}
      </span>
    </div>
  );
}
