import { withSelectorKey } from '@slotted/core/selector-key';
import type { ReactNode } from 'react';

import { IconButton } from '../button';
import { Glyph, Icon } from '../icon';
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  PopoverTrigger,
  usePopover,
} from '../popover';

interface DashboardWidgetHelpProps {
  readonly children: ReactNode;
  readonly label: string;
  /** The widget's title, which heads the sheet that covers the widget. */
  readonly title: string;
}

/**
 * The note behind an information control beside a widget's title. The popover
 * is the platform of the family: focus returns to the control on Escape.
 */
export function DashboardWidgetHelp({ children, label, title }: DashboardWidgetHelpProps) {
  return (
    <Popover align="start" presentation="auto" side="bottom" size="sm">
      <PopoverTrigger
        render={(props) => (
          <IconButton
            {...props}
            aria-label={label}
            inline
            render={(button) => <button {...withSelectorKey(button, 'part', 'help')} />}
            size="sm"
            tone="secondary"
            variant="ghost"
          >
            <Icon>
              <Glyph name="circle-info" />
            </Icon>
          </IconButton>
        )}
      />
      <PopoverLayer>
        <HelpPanel label={label} title={title}>
          {children}
        </HelpPanel>
      </PopoverLayer>
    </Popover>
  );
}

function HelpPanel({ children, label, title }: DashboardWidgetHelpProps) {
  const { sheet } = usePopover();

  return (
    <PopoverContent aria-label={sheet ? title : label}>
      <PopoverBody>
        <div data-part="help-note" data-part-help-note="">
          {children}
        </div>
      </PopoverBody>
    </PopoverContent>
  );
}
