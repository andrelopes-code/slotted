import { Fullscreen, FullscreenContent, FullscreenTrigger } from '@slotted/react/fullscreen';

import Console from './Console';
import StageAxes from './StageAxes';

interface Props {
  /** The line above the console: what it is and where its data comes from. */
  note: string;
}

/**
 * The home stage: the axis bar and the console in one region that can take
 * the whole screen. Full screen keeps the bar, so the scheme and the density
 * still change the console there.
 */
export default function Stage({ note }: Props) {
  return (
    <Fullscreen className="stage">
      <div className="stage-bar">
        <p className="stage-note">{note}</p>
        <div className="stage-tools">
          <StageAxes target="console-frame" />
          <FullscreenTrigger size="sm" variant="outline" />
        </div>
      </div>
      <FullscreenContent
        className="stage-frame"
        id="console-frame"
        data-slotted-theme="default"
        data-slotted-density="compact"
      >
        <Console />
      </FullscreenContent>
    </Fullscreen>
  );
}
