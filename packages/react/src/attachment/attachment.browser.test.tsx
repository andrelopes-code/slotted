import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';

import {
  Attachment,
  AttachmentBody,
  AttachmentDetail,
  AttachmentGroup,
  AttachmentPreview,
  AttachmentTrigger,
} from './index';

const PICTURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120">' +
      '<rect width="200" height="120" fill="teal"/>' +
      '</svg>',
  );

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The trigger is stretched over the attachment by an absolute `::after` whose
 * containing block is the root. A `translate` on the pressed trigger made the
 * trigger that block, so the target shrank to the name for the press: the
 * release landed on the preview and the click went to the root.
 */
describe('a press on a vertical attachment', () => {
  it.each(['preview', 'detail', 'filename'])(
    'at the centre of the %s activates the trigger',
    async (part) => {
      const onClick = vi.fn();
      render(
        <AttachmentGroup layout="grid" orientation="vertical">
          <Attachment file={{ name: 'photo.png', type: 'image/png', size: 1000 }}>
            <AttachmentPreview src={PICTURE} />
            <AttachmentBody>
              <AttachmentTrigger onClick={onClick} />
              <AttachmentDetail />
            </AttachmentBody>
          </Attachment>
        </AttachmentGroup>,
      );
      await frame();
      const trigger = document.querySelector('[data-ui="attachment"] [data-part="trigger"]')!;
      const target = document.querySelector(`[data-ui="attachment"] [data-part="${part}"]`)!;
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      expect(document.elementFromPoint(x, y)).toBe(trigger);

      await mouse('mousePressed', x, y);
      await frame();

      expect(document.elementFromPoint(x, y)).toBe(trigger);

      await mouse('mouseReleased', x, y);

      expect(onClick).toHaveBeenCalledTimes(1);
    },
  );
});

async function mouse(type: 'mousePressed' | 'mouseReleased', x: number, y: number) {
  const offset = window.frameElement?.getBoundingClientRect();

  await cdp().send('Input.dispatchMouseEvent', {
    type,
    x: (offset?.left ?? 0) + x,
    y: (offset?.top ?? 0) + y,
    button: 'left',
    buttons: type === 'mousePressed' ? 1 : 0,
    clickCount: 1,
  });
}
