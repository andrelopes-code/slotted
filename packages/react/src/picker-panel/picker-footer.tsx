import { pickerPanelMessages } from '@slotted/core/i18n';
import type { MouseEvent, ReactNode } from 'react';

import { useMessages } from '../i18n';

interface PickerFooterProps {
  /** The draft may be written. Ignored without a confirmation. */
  readonly canApply: boolean;
  /** The draft holds something to clear. */
  readonly canClear: boolean;
  /** The picker may be cleared: `clearable`, and not `required`. */
  readonly clearable: boolean;
  /** Whether the panel keeps a draft until Apply. */
  readonly confirm: boolean;
  /** A limit, a zone, or the reason Apply is off. */
  readonly hint: ReactNode;
  readonly invalid?: boolean | undefined;
  readonly onApply: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onClear: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * What the reader is told, and the two actions, on one line in six families.
 * With nothing to say and no action to offer, there is no footer.
 */
export function PickerFooter({
  canApply,
  canClear,
  clearable,
  confirm,
  hint,
  invalid,
  onApply,
  onClear,
}: PickerFooterProps) {
  const t = useMessages(pickerPanelMessages);
  if (!clearable && !confirm && invalid !== true && isSilent(hint)) return null;

  return (
    <div data-part="footer" data-part-footer="">
      <span
        data-part="hint"
        data-part-hint=""
        role="status"
        {...(invalid === true ? { 'data-invalid': '' } : {})}
      >
        {hint}
      </span>

      {clearable && (
        <button
          data-part="clear"
          data-part-clear=""
          disabled={!canClear}
          onClick={onClear}
          type="button"
        >
          {t('clear')}
        </button>
      )}

      {confirm && (
        <button
          data-part="apply"
          data-part-apply=""
          disabled={!canApply}
          onClick={onApply}
          type="button"
        >
          {t('apply')}
        </button>
      )}
    </div>
  );
}

function isSilent(hint: ReactNode): boolean {
  return hint === '' || hint === null || hint === undefined || hint === false;
}
