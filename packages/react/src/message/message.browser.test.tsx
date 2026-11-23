import { fromMarkedTokens } from '@slotted/core/markdown';
import { render } from '@testing-library/react';
import { marked } from 'marked';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Card, CardBody, CardFooter, CardHeader } from '../card';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '../collapsible';
import { Markdown } from '../markdown';
import { Text } from '../typography';
import {
  Bubble,
  BubbleContent,
  Message,
  MessageActivity,
  MessageActivityStep,
  MessageBody,
  type MessageActivityProps,
} from './index';

/**
 * A bubble is as wide as its words, up to its share of the row. A markdown
 * tree inside it measured nothing — its root is a size container — and the
 * bubble shrank to its padding, one letter a line.
 */
describe('a bubble holding a markdown tree', () => {
  it('sizes to the text like plain text', () => {
    render(
      <div style={{ inlineSize: 340 }}>
        <Message align="start">
          <MessageBody>
            <Bubble>
              <BubbleContent>
                <Markdown tree={fromMarkedTokens(marked.lexer('Hello world, a long answer'))} />
              </BubbleContent>
            </Bubble>
          </MessageBody>
        </Message>
      </div>,
    );
    const bubble = document.querySelector('[data-part="bubble"]') as HTMLElement;

    expect(bubble.getBoundingClientRect().width).toBeGreaterThan(150);
  });
});

/**
 * The message styles its own header and footer. A card in the body has parts
 * of the same names, and a descendant rule painted them muted and padded them
 * with the message's inset.
 */
describe('a card nested in a message body', () => {
  it('keeps the color and inset of a card outside a message', () => {
    render(
      <div style={{ inlineSize: 400 }}>
        <Message>
          <MessageBody>
            <NestedCard id="inside" />
          </MessageBody>
        </Message>
        <NestedCard id="outside" />
      </div>,
    );

    const inside = cardPartStyles('inside');
    const outside = cardPartStyles('outside');

    expect(inside).toEqual(outside);
  });
});

function NestedCard({ id }: { id: string }) {
  return (
    <Card id={id}>
      <CardHeader>
        <Text weight="semibold">Title</Text>
      </CardHeader>
      <CardBody>Body</CardBody>
      <CardFooter>Footer</CardFooter>
    </Card>
  );
}

function cardPartStyles(id: string) {
  return ['header', 'footer'].map((part) => {
    const node = document.querySelector(`#${id} [data-part="${part}"]`) as HTMLElement;
    const style = getComputedStyle(node);

    return {
      color: style.color,
      paddingInline: style.paddingInline,
      textColor: getComputedStyle(node.firstElementChild ?? node).color,
    };
  });
}

/**
 * The message stylesheet stops at the first child of a nested family root, so
 * an activity folded into a `Collapsible` panel drew with none of its styling.
 */
describe('an activity nested in another family inside a message body', () => {
  it('keeps the border and padding of an activity directly in the body', () => {
    render(
      <Message align="start" style={{ '--slotted-border-subtle': 'gray' } as CSSProperties}>
        <MessageBody>
          <MessageActivity>
            <MessageActivityStep status="complete">Reading accounts</MessageActivityStep>
          </MessageActivity>
          <Collapsible defaultOpen>
            <CollapsibleHeader>
              <CollapsibleTrigger>Sources consulted: 1</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <MessageActivity>
                <MessageActivityStep status="complete">Reading balances</MessageActivityStep>
              </MessageActivity>
            </CollapsiblePanel>
          </Collapsible>
        </MessageBody>
      </Message>,
    );
    const [direct, nested] = [...document.querySelectorAll('[data-part="activity"]')].map((node) =>
      getComputedStyle(node),
    );

    expect(direct!.borderTopWidth).toBe('1px');
    expect(nested!.borderTopWidth).toBe(direct!.borderTopWidth);
    expect(nested!.paddingTop).toBe(direct!.paddingTop);
  });
});

/* On a rail, with no bubbles, the frame around the steps floats in the turn. */
describe('a plain activity', () => {
  it.each(['thread', 'bubble'] as const)(
    'draws no frame and starts its steps on the edge of the body (%s)',
    (layout) => {
      render(
        <Message
          align="start"
          layout={layout}
          style={
            {
              '--slotted-surface-raised': '#eee',
              '--slotted-shadow-xs': '0 1px red',
            } as CSSProperties
          }
        >
          <MessageBody>
            <MessageActivity data-testid="plain" variant="plain">
              <MessageActivityStep icon={<span />} status="complete">
                Reading accounts
              </MessageActivityStep>
            </MessageActivity>
            <Collapsible defaultOpen>
              <CollapsiblePanel>
                <MessageActivity data-testid="nested" variant="plain">
                  <MessageActivityStep>Reading balances</MessageActivityStep>
                </MessageActivity>
              </CollapsiblePanel>
            </Collapsible>
          </MessageBody>
        </Message>,
      );
      const body = document.querySelector('[data-part="body"]')!.getBoundingClientRect();
      const plain = document.querySelector('[data-testid="plain"]')!;
      const step = plain.querySelector('[data-part="activity-step"]')!.getBoundingClientRect();

      expect(Math.abs(step.left - body.left)).toBeLessThanOrEqual(0.5);
      for (const activity of [plain, document.querySelector('[data-testid="nested"]')!]) {
        const style = getComputedStyle(activity);

        expect(style.borderTopWidth).toBe('0px');
        expect(style.padding).toBe('0px');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.boxShadow).toBe('none');
      }
    },
  );
});

/* An assistant turn on a rail: the tile of each source is the turn's own drawing. */
describe('the tile of an activity step', () => {
  const TILE = {
    '--slotted-message-activity-color-complete': 'rgb(1, 2, 3)',
    '--slotted-message-activity-gap': '8px',
    '--slotted-message-activity-icon-border-color-current': 'rgb(4, 5, 6)',
    '--slotted-message-activity-icon-glyph-size': '12px',
    '--slotted-message-activity-icon-radius': '7px',
    '--slotted-message-activity-icon-size': '22px',
    '--slotted-message-activity-icon-surface': 'rgb(7, 8, 9)',
    '--slotted-message-activity-step-gap': '10px',
    '--slotted-text': 'rgb(10, 11, 12)',
  } as CSSProperties;

  it('takes its size, corners, ground, edge, inks and gaps from the tokens', () => {
    renderSteps({ shimmer: false, style: TILE, variant: 'plain' });
    const [done, current] = steps();
    const edge = (part: Element) => part.getBoundingClientRect();
    const style = (part: Element) => getComputedStyle(part);

    expect(edge(done!.step).height).toBe(22);
    expect(edge(current!.step).top - edge(done!.step).bottom).toBe(8);
    expect(edge(done!.words).left - edge(done!.tile).right).toBe(10);
    expect(edge(done!.tile).width).toBe(22);
    expect(style(done!.tile).borderRadius).toBe('7px');
    expect(style(done!.tile).backgroundColor).toBe('rgb(7, 8, 9)');
    expect(style(done!.tile).color).toBe('rgb(1, 2, 3)');
    expect(style(current!.tile).borderTopColor).toBe('rgb(4, 5, 6)');
    expect(edge(done!.tile.querySelector('svg')!).width).toBe(12);
    expect(edge(current!.tile.querySelector('svg')!).width).toBe(12);
    expect(style(current!.words).color).toBe('rgb(10, 11, 12)');
  });

  it('stands on the raised surface where no frame does, and on the surface inside one', () => {
    const grounds = {
      '--slotted-surface': 'rgb(1, 1, 1)',
      '--slotted-surface-raised': 'rgb(2, 2, 2)',
    } as CSSProperties;
    const { unmount } = renderSteps({ style: grounds, variant: 'plain' });
    expect(getComputedStyle(steps()[0]!.tile).backgroundColor).toBe('rgb(2, 2, 2)');
    unmount();

    renderSteps({ style: grounds });
    expect(getComputedStyle(steps()[0]!.tile).backgroundColor).toBe('rgb(1, 1, 1)');
  });

  it.each([true, false])('sweeps the words of the current step (shimmer: %s)', (shimmer) => {
    renderSteps({
      shimmer,
      style: {
        '--slotted-duration-loop-slow': '2s',
        '--slotted-text': 'rgb(0, 0, 0)',
        '--slotted-text-muted': 'rgb(90, 90, 90)',
      } as CSSProperties,
    });
    const { words } = steps()[1]!;

    expect(getComputedStyle(words).animationName).toBe(shimmer ? 'slotted-message-sweep' : 'none');
    expect(getComputedStyle(words).backgroundImage === 'none').toBe(!shimmer);
  });

  it('rises by the token as a step enters', () => {
    renderSteps({
      style: {
        '--slotted-duration-medium': '10s',
        '--slotted-message-activity-rise': '40px',
      } as CSSProperties,
    });

    expect(parseFloat(getComputedStyle(steps()[1]!.step).translate.split(' ')[1]!)).toBeGreaterThan(
      20,
    );
  });

  function renderSteps(props: MessageActivityProps) {
    return render(
      <Message layout="thread">
        <MessageBody>
          <MessageActivity {...props}>
            <MessageActivityStep icon={<svg viewBox="0 0 24 24" />} status="complete">
              Reading balances
            </MessageActivityStep>
            <MessageActivityStep icon={<svg viewBox="0 0 24 24" />}>
              Projecting a balance
            </MessageActivityStep>
          </MessageActivity>
        </MessageBody>
      </Message>,
    );
  }

  function steps() {
    return [...document.querySelectorAll('[data-part="activity-step"]')].map((step) => ({
      step,
      tile: step.firstElementChild!,
      words: step.lastElementChild!,
    }));
  }
});
