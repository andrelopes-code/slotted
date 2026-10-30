import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/list-item/contract.json';
import { List } from '../list';
import {
  ListItem,
  ListItemActions,
  ListItemBody,
  ListItemButton,
  ListItemContent,
  ListItemDefaultsProvider,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemLink,
  ListItemStart,
} from './index';

const full = (props: Parameters<typeof ListItem>[0] = {}) => (
  <List aria-label="Folders">
    <ListItem data-testid="row" {...props}>
      <ListItemContent data-testid="content">
        <ListItemStart data-testid="start" />
        <ListItemBody data-testid="body">
          <ListItemLabel data-testid="label">Photos</ListItemLabel>
          <ListItemDescription data-testid="description">128 files</ListItemDescription>
        </ListItemBody>
        <ListItemEnd data-testid="end">Yesterday</ListItemEnd>
      </ListItemContent>
      <ListItemActions data-testid="actions">
        <button type="button">Remove</button>
      </ListItemActions>
    </ListItem>
  </List>
);

describe('ListItem', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(full());

    expect(screen.getByTestId('row')).toHaveAttribute('data-ui', contract.ui);
    for (const part of ['content', 'start', 'body', 'label', 'description', 'end', 'actions']) {
      expect(screen.getByTestId(part)).toHaveAttribute('data-part', part);
    }
    expect(screen.getByTestId('row')).toHaveAttribute('data-part', 'root');
  });

  /**
   * Interactive content may not nest inside `a` or `button`. Every surveyed
   * implementation lets a consumer nest them anyway; the parts here make the
   * sibling arrangement the only one they express.
   */
  it('places independent targets beside the box, never inside it', () => {
    render(full());

    expect(screen.getByTestId('row')).toContainElement(screen.getByTestId('actions'));
    expect(screen.getByTestId('content')).not.toContainElement(screen.getByTestId('actions'));
  });

  it('renders the box as the element the page means', () => {
    render(
      <List>
        <ListItem>
          <ListItemContent data-testid="static" />
        </ListItem>
        <ListItem>
          <ListItemButton data-testid="command" />
        </ListItem>
        <ListItem>
          <ListItemLink data-testid="destination" href="/photos" />
        </ListItem>
      </List>,
    );

    expect(screen.getByTestId('static').tagName).toBe('DIV');
    expect(screen.getByTestId('command').tagName).toBe('BUTTON');
    expect(screen.getByTestId('command')).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('destination').tagName).toBe('A');
    expect(screen.getByTestId('destination')).toHaveAttribute('href', '/photos');
  });

  /**
   * ARIA 1.2 deprecates `aria-disabled` on `listitem`, and no surveyed
   * implementation says so — MUI writes it on the row. The state is painted
   * from `data-disabled` and the attribute goes where an interaction can
   * actually be refused.
   */
  it('keeps the deprecated attribute off the row and puts it where it works', () => {
    render(
      <List>
        <ListItem data-testid="row" disabled>
          <ListItemButton data-testid="command" />
        </ListItem>
        <ListItem disabled>
          <ListItemLink data-testid="destination" href="/photos" />
        </ListItem>
      </List>,
    );

    expect(screen.getByTestId('row')).toHaveAttribute('data-disabled', '');
    expect(screen.getByTestId('row')).not.toHaveAttribute('aria-disabled');

    expect(screen.getByTestId('command')).toBeDisabled();
    expect(screen.getByTestId('destination')).toHaveAttribute('aria-disabled', 'true');
    /* The destination stays: `aria-disabled` keeps the element focusable, so a
       reader can reach the row and hear why it is unavailable. */
    expect(screen.getByTestId('destination')).toHaveAttribute('href', '/photos');
  });

  /**
   * The destination stays in the DOM, so the refusal has to be the handler's.
   * The same one covers both ways in: a pointer, and `Enter` on a focused
   * anchor, which the platform also delivers as a click.
   */
  it('refuses the interaction a disabled row cannot perform', () => {
    const onClick = vi.fn();

    render(
      <List>
        <ListItem disabled>
          <ListItemLink data-testid="destination" href="/photos" onClick={onClick} />
        </ListItem>
      </List>,
    );

    fireEvent.click(screen.getByTestId('destination'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('runs the consumer handler untouched while the row is operable', () => {
    const onClick = vi.fn();

    render(
      <List>
        <ListItem>
          <ListItemLink data-testid="destination" href="/photos" onClick={onClick} />
        </ListItem>
      </List>,
    );

    fireEvent.click(screen.getByTestId('destination'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * `docs/component-features.md` §2.5: a loading control keeps its width,
   * blocks the duplicate action and keeps its accessible name.
   */
  it('says a row is busy and takes the activation away', () => {
    render(
      <List>
        <ListItem data-testid="row" loading>
          <ListItemButton data-testid="command">Publish</ListItemButton>
        </ListItem>
      </List>,
    );

    expect(screen.getByTestId('row')).toHaveAttribute('data-loading', '');
    expect(screen.getByTestId('command')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('command')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  /**
   * `aria-selected` is not valid on `listitem`, so the row paints a selection
   * the page owns and the control in `start` announces it. `aria-current` is
   * inherited by the role and is not deprecated, so the row does say that one.
   */
  it('paints a selection it does not announce, and announces the one state it may', () => {
    render(
      <List>
        <ListItem data-testid="selected" selected>
          <ListItemContent />
        </ListItem>
        <ListItem data-testid="current" current="page">
          <ListItemContent />
        </ListItem>
      </List>,
    );

    expect(screen.getByTestId('selected')).toHaveAttribute('data-selected', '');
    expect(screen.getByTestId('selected')).not.toHaveAttribute('aria-selected');

    expect(screen.getByTestId('current')).toHaveAttribute('data-current', '');
    expect(screen.getByTestId('current')).toHaveAttribute('aria-current', 'page');
  });

  /**
   * ARIA 1.2 is explicit that both are unnecessary while every row is in the
   * document and necessary the moment only part of the set is.
   */
  it('states a position in the set only when the page knows one', () => {
    render(
      <List>
        <ListItem data-testid="silent">
          <ListItemContent />
        </ListItem>
        <ListItem data-testid="placed" position={7} setSize={42}>
          <ListItemContent />
        </ListItem>
      </List>,
    );

    expect(screen.getByTestId('silent')).not.toHaveAttribute('aria-posinset');
    expect(screen.getByTestId('silent')).not.toHaveAttribute('aria-setsize');
    expect(screen.getByTestId('placed')).toHaveAttribute('aria-posinset', '7');
    expect(screen.getByTestId('placed')).toHaveAttribute('aria-setsize', '42');
  });

  it('lets an application set its rows once, and lets a row still win', () => {
    render(
      <ListItemDefaultsProvider align="start" tone="danger" truncate>
        <List>
          <ListItem data-testid="inherited">
            <ListItemContent />
          </ListItem>
          <ListItem data-testid="own" tone="accent">
            <ListItemContent />
          </ListItem>
        </List>
      </ListItemDefaultsProvider>,
    );

    expect(screen.getByTestId('inherited')).toHaveAttribute('data-align', 'start');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-truncate', '');
    expect(screen.getByTestId('own')).toHaveAttribute('data-tone', 'accent');
  });

  it('renders the destination into the element the page means', () => {
    render(
      <List>
        <ListItem>
          <ListItemLink
            href="/photos"
            render={(props) => <a {...props} data-testid="router" data-router="" />}
          />
        </ListItem>
      </List>,
    );

    expect(screen.getByTestId('router')).toHaveAttribute('data-part', 'content');
    expect(screen.getByTestId('router')).toHaveAttribute('data-router', '');
  });

  /** A row outside a list still renders a working row, on its own defaults. */
  it('falls back to its own answers when there is no set around it', () => {
    render(
      <ListItem data-testid="row">
        <ListItemContent />
      </ListItem>,
    );

    expect(screen.getByTestId('row')).toHaveAttribute('data-variant', 'plain');
    expect(screen.getByTestId('row')).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('row')).toHaveAttribute('data-marker', 'none');
    expect(screen.getByTestId('row').querySelector('[data-part="marker"]')).toBeNull();
  });

  /** The bullet is the dot Glyph in a part of its own; the number stays text. */
  it('draws the bullet with the dot glyph before the content', () => {
    render(
      <List>
        <ListItem data-testid="bullet" marker="bullet">
          <ListItemContent />
        </ListItem>
        <ListItem data-testid="number" marker="number">
          <ListItemContent />
        </ListItem>
      </List>,
    );

    const marker = screen.getByTestId('bullet').firstElementChild;
    expect(marker).toHaveAttribute('data-part', 'marker');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expect(marker?.querySelector('[data-ui="icon"] > svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'dot',
    );
    expect(screen.getByTestId('number').querySelector('[data-part="marker"]')).toBeNull();
  });

  it('declares no state model, and the contract agrees', () => {
    expect('stateModel' in contract).toBe(false);
    expect(contract.roleFacts.deprecated).toContain('aria-disabled');
  });
});

/**
 * A body written around the box instead of inside it drew as unstyled text
 * and said nothing, so the mistake survived every test that read text. In
 * development the text parts name the parent they expect, once per part, and
 * the box says when it sits inside a body.
 */
describe('a row composed in the wrong nesting', () => {
  it('names the parent the body expects, once', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <ListItem>
          <ListItemBody>
            <ListItemContent />
          </ListItemBody>
        </ListItem>,
      );
      render(
        <ListItem>
          <ListItemBody>
            <ListItemLabel>Again</ListItemLabel>
          </ListItemBody>
        </ListItem>,
      );
      const messages = error.mock.calls.map((call) => String(call[0]));
      expect(
        messages.filter(
          (message) =>
            message ===
            'ListItemBody must be inside ListItemContent, ListItemLink or ListItemButton',
        ),
      ).toHaveLength(1);
      expect(
        messages.filter((message) => message.startsWith('ListItemContent must not be inside')),
      ).toHaveLength(1);
    } finally {
      error.mockRestore();
    }
  });

  it('says nothing about a row nested as intended', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <ListItem>
          <ListItemButton>
            <ListItemBody>
              <ListItemLabel>Title</ListItemLabel>
              <ListItemDescription>Line</ListItemDescription>
            </ListItemBody>
          </ListItemButton>
        </ListItem>,
      );
      expect(error.mock.calls.filter((call) => String(call[0]).startsWith('ListItem'))).toEqual([]);
    } finally {
      error.mockRestore();
    }
  });
});
