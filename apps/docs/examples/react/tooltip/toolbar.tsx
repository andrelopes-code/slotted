import { IconButton } from '@slotted/react/button';
import { Glyph, type GlyphName } from '@slotted/react/icon';
import { Toolbar, ToolbarSeparator } from '@slotted/react/toolbar';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipDefaultsProvider,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';

interface Action {
  icon: GlyphName;
  label: string;
}

const DOCUMENTS: Action[] = [
  { icon: 'copy', label: 'Copy order number' },
  { icon: 'file-text', label: 'Print packing slip' },
  { icon: 'paperclip', label: 'Attach invoice' },
];

const TRACKING: Action[] = [
  { icon: 'bell', label: 'Notify me on delivery' },
  { icon: 'pin', label: 'Pin to overview' },
  { icon: 'external', label: 'Open on the UPS site' },
];

function ToolbarAction({ icon, label }: Action) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <IconButton {...props} size="sm" variant="ghost">
            <Glyph name={icon} />
          </IconButton>
        )}
      />
      <TooltipLayer>
        <TooltipContent>{label}</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}

export default function TooltipToolbar() {
  return (
    <TooltipDefaultsProvider describes="label" size="sm">
      <Toolbar aria-label="Order SO-10485">
        {DOCUMENTS.map((action) => (
          <ToolbarAction key={action.label} {...action} />
        ))}
        <ToolbarSeparator />
        {TRACKING.map((action) => (
          <ToolbarAction key={action.label} {...action} />
        ))}
      </Toolbar>
    </TooltipDefaultsProvider>
  );
}
