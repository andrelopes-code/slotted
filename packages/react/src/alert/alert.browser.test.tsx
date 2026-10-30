import { render } from '@testing-library/react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Button } from '../button';
import { Alert } from './alert';
import { AlertActions, AlertContent, AlertDescription } from './alert-parts';
import type { AlertProps } from './alert.types';

function placed(props: Partial<AlertProps>) {
  render(
    <Alert {...props}>
      <AlertContent>
        <AlertDescription>The suggestion changes three lines of the plan.</AlertDescription>
      </AlertContent>
      <AlertActions>
        <Button size="sm">Discard</Button>
        <Button size="sm">Apply</Button>
      </AlertActions>
    </Alert>,
  );
  const box = (part: string) =>
    document.querySelector(`[data-part="${part}"]`)!.getBoundingClientRect();
  return {
    actions: box('actions'),
    content: box('content'),
    dismiss: () => box('dismiss'),
  };
}

const centre = (box: DOMRect) => box.top + box.height / 2;

describe('the actions of an alert', () => {
  beforeEach(async () => {
    await page.viewport(960, 800);
  });
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('stand at the end of a one-line message under actionsPlacement="end"', () => {
    const { actions, content } = placed({ actionsPlacement: 'end' });

    expect(actions.left).toBeGreaterThanOrEqual(content.right);
    expect(Math.abs(centre(actions) - centre(content))).toBeLessThanOrEqual(0.5);
  });

  it('keep the dismiss control last, on the same line', () => {
    const { actions, dismiss: measure } = placed({ actionsPlacement: 'end', dismissible: true });
    const dismiss = measure();

    expect(dismiss.left).toBeGreaterThanOrEqual(actions.right);
    expect(dismiss.top).toBeLessThan(actions.bottom);
  });

  it('stand on the first line of a page banner whose message wraps', () => {
    render(
      <Alert dismissible reach="page">
        <AlertContent>
          <AlertDescription>
            {'The suggestion changes three lines of the plan and moves the review date. '.repeat(4)}
          </AlertDescription>
        </AlertContent>
        <AlertActions>
          <Button size="sm">Apply</Button>
        </AlertActions>
      </Alert>,
    );
    const box = (part: string) =>
      document.querySelector(`[data-part="${part}"]`)!.getBoundingClientRect();
    const description = document.querySelector('[data-part="description"]')!;
    const line = Number.parseFloat(getComputedStyle(description).lineHeight);
    const content = box('content');

    expect(content.height).toBeGreaterThan(2 * line);
    expect(box('actions').left).toBeGreaterThanOrEqual(content.right);
    expect(box('actions').top).toBeLessThan(content.top + line);
    expect(box('dismiss').top).toBeLessThan(content.top + line);
  });

  it('go back under the message in a box narrower than 40rem', () => {
    render(
      <div style={{ inlineSize: '30rem' }}>
        <Alert actionsPlacement="end">
          <AlertContent>
            <AlertDescription>The suggestion changes three lines.</AlertDescription>
          </AlertContent>
          <AlertActions>
            <Button size="sm">Apply</Button>
          </AlertActions>
        </Alert>
      </div>,
    );
    const actions = document.querySelector('[data-part="actions"]')!.getBoundingClientRect();
    const content = document.querySelector('[data-part="content"]')!.getBoundingClientRect();

    expect(actions.top).toBeGreaterThanOrEqual(content.bottom);
  });

  it('go under the message by default', () => {
    const { actions, content } = placed({});

    expect(actions.top).toBeGreaterThanOrEqual(content.bottom);
  });

  it('go under the message of a page banner under actionsPlacement="below"', () => {
    const { actions, content } = placed({ actionsPlacement: 'below', reach: 'page' });

    expect(actions.top).toBeGreaterThanOrEqual(content.bottom);
  });

  it('stand at the end of a page banner by default', () => {
    const { actions, content } = placed({ reach: 'page' });

    expect(actions.left).toBeGreaterThanOrEqual(content.right);
  });
});
