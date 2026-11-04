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
