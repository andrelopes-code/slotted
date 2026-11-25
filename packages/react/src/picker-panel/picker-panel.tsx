import type { ReactNode } from 'react';

/** Which picker a panel belongs to. */
export type PickerKind =
  'date' | 'time' | 'date-range' | 'datetime' | 'datetime-range' | 'time-range';

/** The part one column shows. */
export type PickerShowing = 'day' | 'time';

interface PickerPanelProps {
  readonly children: ReactNode;
  readonly footer: ReactNode;
  readonly kind: PickerKind;
  readonly rail?: ReactNode;
  readonly showing?: PickerShowing;
  readonly side?: ReactNode;
}

/** The grid of a panel: the rail, the modules, and the footer under all of them. */
export function PickerPanel({
  children,
  footer,
  kind,
  rail,
  showing = kind === 'time' || kind === 'time-range' ? 'time' : 'day',
  side,
}: PickerPanelProps) {
  return (
    <div
      data-kind={kind}
      data-part="root"
      data-part-root=""
      data-showing={showing}
      data-ui="picker-panel"
      data-ui-picker-panel=""
    >
      {rail}

      <div data-part="main" data-part-main="">
        {children}
      </div>

      {side !== undefined && (
        <div data-part="side" data-part-side="">
          {side}
        </div>
      )}

      {footer}
    </div>
  );
}
