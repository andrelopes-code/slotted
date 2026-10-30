import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, AlertContent, AlertDescription } from '../alert';
import { Message, MessageBody } from '../message';
import { MessageScroller, MessageScrollerContent, MessageScrollerViewport } from './index';

/**
 * The scroller lays out its own `content` part. An alert in a message has a
 * part of the same name, and a descendant rule gave it the scroller's inset,
 * its full height and its bottom alignment.
 */
describe('an alert nested in a message of the scroller', () => {
  it('keeps its own content layout', () => {
    render(
      <div style={{ blockSize: 400, inlineSize: 338 }}>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <Message>
                <MessageBody>
                  <Alert reach="inline" tone="warning">
                    <AlertContent>
                      <AlertDescription>
                        A sentence long enough to wrap onto a second line inside a narrow column.
                      </AlertDescription>
                    </AlertContent>
                  </Alert>
                </MessageBody>
              </Message>
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </div>,
    );
    const content = document.querySelector(
      '[data-ui="alert"] [data-part="content"]',
    ) as HTMLElement;

    const style = getComputedStyle(content);

    expect(style.padding).toBe('0px');
    expect(style.minBlockSize).not.toBe('100%');
    expect(style.justifyContent).not.toBe('flex-end');
  });
});
