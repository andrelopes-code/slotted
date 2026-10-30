import { IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';
import { Text } from '@slotted/react/typography';

export default function TooltipIconButton() {
  return (
    <Inline gap={2} align="center">
      <Text numeric="tabular">UPS 1Z999AA10123456784</Text>
      <Tooltip describes="label">
        <TooltipTrigger
          render={(props) => (
            <IconButton {...props} variant="ghost">
              <Glyph name="copy" />
            </IconButton>
          )}
        />
        <TooltipLayer>
          <TooltipContent>Copy tracking number</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
      <Tooltip describes="label">
        <TooltipTrigger
          render={(props) => (
            <IconButton {...props} variant="ghost">
              <Glyph name="external" />
            </IconButton>
          )}
        />
        <TooltipLayer>
          <TooltipContent>Open on the UPS site</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
    </Inline>
  );
}
