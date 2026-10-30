import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Tooltip,
  type TooltipAlign,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  type TooltipSide,
  TooltipTrigger,
} from '@slotted/react/tooltip';

const ACTIONS: { label: string; hint: string; side: TooltipSide; align: TooltipAlign }[] = [
  {
    label: 'Print label',
    hint: 'Prints a 4 × 6 label at packing station 3.',
    side: 'top',
    align: 'center',
  },
  {
    label: 'Weigh parcel',
    hint: 'Reads the scale under station 3.',
    side: 'bottom',
    align: 'center',
  },
  {
    label: 'Previous order',
    hint: 'SO-10484 · Northgate Labs',
    side: 'inline-start',
    align: 'center',
  },
  { label: 'Next order', hint: 'SO-10486 · Quill & Co.', side: 'inline-end', align: 'start' },
];

export default function TooltipPlacement() {
  return (
    <Inline gap={3} align="center">
      {ACTIONS.map((action) => (
        <Tooltip key={action.label} side={action.side} align={action.align}>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                {action.label}
              </Button>
            )}
          />
          <TooltipLayer>
            <TooltipContent>{action.hint}</TooltipContent>
            <TooltipArrow />
          </TooltipLayer>
        </Tooltip>
      ))}
    </Inline>
  );
}
