import type { ReactNode } from 'react';

interface PickerHeadProps {
  readonly empty?: boolean | undefined;
  readonly invalid?: boolean | undefined;
  readonly meta: string;
  readonly steps?: ReactNode;
  readonly value: string;
}

interface PickerTimeHeadProps {
  /** The field the time is typed in. */
  readonly children: ReactNode;
  readonly label: string;
  readonly meta: string;
}

/** The value in words, what it means beside today, and the steps that move it. */
export function PickerHead({ empty, invalid, meta, steps, value }: PickerHeadProps) {
  return (
    <div data-part="head" data-part-head="">
      <span
        data-part="value"
        data-part-value=""
        {...(empty === true ? { 'data-empty': '' } : {})}
        {...(invalid === true ? { 'data-invalid': '' } : {})}
      >
        {value}
      </span>
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
export function PickerTimeHead({ children, label, meta }: PickerTimeHeadProps) {
  return (
    <div data-part="time-head" data-part-time-head="">
      <span data-part="time-label" data-part-time-label="">
        {label}
      </span>
      <span data-part="time-meta" data-part-time-meta="">
        {meta}
      </span>
      <span data-part="time-value" data-part-time-value="">
        {children}
      </span>
    </div>
  );
}
