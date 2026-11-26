import { withSelectorKey } from '@slotted/core/selector-key';
import { spokenText } from '@slotted/core/text';
import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import { Popover, PopoverBody, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';
import { useField } from './field-context';
import type { FieldHelpProps } from './field.types';

interface FieldHelpSheetProps extends Omit<FieldHelpProps, 'presentation' | 'side'> {
  /** The name of the button, which heads the sheet of a field with no label. */
  readonly label: string;
  /** The hidden node that describes the button and the control. */
  readonly textId: string;
}

/**
 * The help of a field on a phone: the sheet of `Popover presentation="auto"`,
 * headed by the field's label beside a close control. Focus goes back to the
 * help button on close, so the reader is back beside the control.
 */
export function FieldHelpSheet({
  children,
  defaultOpen,
  label,
  onOpenChange,
  open,
  textId,
  ...buttonProps
}: FieldHelpSheetProps) {
  return (
    <Popover defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open} presentation="auto">
      <PopoverTrigger {...withSelectorKey(buttonProps, 'part', 'help')}>
        <Icon>
          <Glyph name="circle-question" />
        </Icon>
        <span data-part="help-text" data-part-help-text="" hidden id={textId}>
          {children}
        </span>
      </PopoverTrigger>

      <PopoverLayer>
        <FieldHelpPanel fallback={label}>{children}</FieldHelpPanel>
      </PopoverLayer>
    </Popover>
  );
}

interface FieldHelpPanelProps {
  readonly children: ReactNode;
  readonly fallback: string;
}

/** The sheet's panel, named by the label the field draws. */
function FieldHelpPanel({ children, fallback }: FieldHelpPanelProps) {
  const field = useField();
  const [heading, setHeading] = useState<string | undefined>(undefined);
  const labelId = field?.ids.label;
  const controlId = field?.ids.control;

  /* Read before the sheet is painted: the label is the field's own markup. */
  useLayoutEffect(() => {
    if (labelId === undefined || controlId === undefined) return;

    const label =
      document.getElementById(labelId) ??
      document.querySelector(`label[for="${CSS.escape(controlId)}"]`);
    setHeading(label === null ? undefined : spokenText(label) || undefined);
  }, [controlId, labelId]);

  return (
    <PopoverContent aria-label={heading ?? fallback}>
      <PopoverBody>{children}</PopoverBody>
    </PopoverContent>
  );
}
