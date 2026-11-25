import type { MouseEvent, ReactNode } from 'react';

/** A head that brings its part, in a panel of one part at a time. */
export interface PickerReveal {
  readonly onShow: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly shown: boolean;
}

interface PickerHeadProps {
  readonly empty?: boolean | undefined;
  readonly invalid?: boolean | undefined;
  readonly meta: string;
  readonly reveal?: PickerReveal | undefined;
  readonly steps?: ReactNode;
  readonly value: string;
}

interface PickerTimeHeadProps {
  /** The field the time is typed in. */
  readonly children: ReactNode;
  readonly label: string;
  readonly meta: string;
  readonly reveal?: PickerReveal | undefined;
}

/** The value in words, what it means beside today, and the steps that move it. */
export function PickerHead({ empty, invalid, meta, reveal, steps, value }: PickerHeadProps) {
  return (
    <div data-part="head" data-part-head="">
      <PickerHeadName
        part="value"
        reveal={reveal}
        {...(empty === true ? { 'data-empty': '' } : {})}
        {...(invalid === true ? { 'data-invalid': '' } : {})}
      >
        {value}
      </PickerHeadName>
      <span data-part="meta" data-part-meta="">
        {meta}
      </span>
      {steps !== undefined && (
        <span data-part="steps" data-part-steps="">
          {steps}
        </span>
      )}
    </div>
  );
}

/** The name of a time, what it means beside now, and the field it is typed in. */
export function PickerTimeHead({ children, label, meta, reveal }: PickerTimeHeadProps) {
  return (
    <div data-part="time-head" data-part-time-head="">
      <PickerHeadName part="time-label" reveal={reveal}>
        {label}
      </PickerHeadName>
      <span data-part="time-meta" data-part-time-meta="">
        {meta}
      </span>
      <span data-part="time-value" data-part-time-value="">
        {children}
      </span>
    </div>
  );
}

interface PickerHeadNameProps {
  readonly children: ReactNode;
  readonly 'data-empty'?: '';
  readonly 'data-invalid'?: '';
  readonly part: 'time-label' | 'value';
  readonly reveal: PickerReveal | undefined;
}

function PickerHeadName({ children, part, reveal, ...state }: PickerHeadNameProps) {
  const name = { ...state, 'data-part': part, [`data-part-${part}`]: '' };
  if (reveal === undefined) return <span {...name}>{children}</span>;

  return (
    <button {...name} aria-expanded={reveal.shown} onClick={reveal.onShow} type="button">
      {children}
    </button>
  );
}
