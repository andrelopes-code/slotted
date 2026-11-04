import { withSelectorKey } from '@slotted/core/selector-key';
import type { ReactNode } from 'react';

import { IconButton } from '../button';
import { Glyph, Icon } from '../icon';
import { Popover, PopoverBody, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';

interface DashboardWidgetHelpProps {
  readonly children: ReactNode;
  readonly label: string;
}

/**
 * The note behind an information control beside a widget's title. The popover
 * is the platform of the family: focus returns to the control on Escape.
 */
export function DashboardWidgetHelp({ children, label }: DashboardWidgetHelpProps) {
  return (
    <Popover align="start" side="bottom" size="sm">
      <PopoverTrigger
        render={(props) => (
          <IconButton
            {...props}
            aria-label={label}
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
        <PopoverContent aria-label={label}>
          <PopoverBody>{children}</PopoverBody>
        </PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}
