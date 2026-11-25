import { withSelectorKey } from '@slotted/core/selector-key';
import type { ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
  usePopover,
} from '../popover';

interface ChartHelpProps {
  readonly children: ReactNode;
  readonly label: string;
  /** The chart's title, which heads the sheet that covers the chart. */
  readonly title: ReactNode;
}

/** The note behind the information control beside the chart's title. */
export function ChartHelp({ children, label, title }: ChartHelpProps) {
  return (
    <Popover align="start" presentation="auto" side="bottom" size="sm">
      <PopoverTrigger
        render={(props) => (
          <button {...withSelectorKey(props, 'part', 'help')} aria-label={label} type="button">
            <Icon>
              <Glyph name="circle-info" />
            </Icon>
          </button>
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

function HelpPanel({ children, label, title }: ChartHelpProps) {
  const { sheet } = usePopover();
  const headed = sheet && title !== undefined;

  return (
    <PopoverContent {...(headed ? {} : { 'aria-label': label })}>
      {headed && (
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverClose />
        </PopoverHeader>
      )}

      <PopoverBody>
        <div data-part="help-content" data-part-help-content="">
          {children}
        </div>
      </PopoverBody>
    </PopoverContent>
  );
}
