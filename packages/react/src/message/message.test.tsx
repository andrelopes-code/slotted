import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/message/contract.json';
import { Avatar } from '../avatar';
import { SlottedProvider } from '../i18n';
import {
  Bubble,
  BubbleCaret,
  BubbleContent,
  BubbleMeta,
  BubbleQuote,
  BubbleReaction,
  BubbleReactions,
  BubbleRetry,
  BubbleStream,
  BubbleTyping,
  Message,
  MessageActions,
  MessageActivity,
  MessageActivityStep,
  MessageAuthor,
  MessageAvatar,
  MessageBody,
  MessageDefaultsProvider,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  MessageReceipt,
  MessageTime,
  MessageVersions,
} from './index';

const everything = () => (
  <MessageGroup data-testid="group">
    <Message data-testid="row" status="read" versionCount={3}>
      <MessageAvatar>
        <Avatar name="Marta Silva" />
      </MessageAvatar>
      <MessageBody>
        <MessageHeader>
          <MessageAuthor>Marta Silva</MessageAuthor>
          <MessageTime dateTime="2026-09-30T09:38">09:38</MessageTime>
        </MessageHeader>
        <MessageActivity>
          <MessageActivityStep status="complete">Li o registo</MessageActivityStep>
          <MessageActivityStep>A procurar a causa</MessageActivityStep>
        </MessageActivity>
        <Bubble data-testid="bubble" maxLines={3}>
          <BubbleContent>
            <BubbleQuote author="Tyler">The account does not exist.</BubbleQuote>
            <BubbleStream text="It arrives this afternoon." />
            <BubbleCaret />
            <BubbleTyping />
            <BubbleMeta>
              <MessageTime dateTime="2026-09-30T09:41">09:41</MessageTime>
              <MessageReceipt />
            </BubbleMeta>
          </BubbleContent>
          <BubbleRetry />
          <BubbleReactions>
            <BubbleReaction count={2}>👍</BubbleReaction>
          </BubbleReactions>
        </Bubble>
        <MessageFooter>
          <MessageVersions />
          <MessageActions>
            <button type="button">Copiar</button>
          </MessageActions>
        </MessageFooter>
      </MessageBody>
    </Message>
  </MessageGroup>
);

describe('Message', () => {
  it('is selected in public by the family identifier and writes every contract part', () => {
    render(everything());
    const row = screen.getByTestId('row');
    expect(row).toHaveAttribute('data-ui', contract.ui);
    expect(row.tagName).toBe('ARTICLE');
    const parts = [...contract.members.message.parts, ...contract.members.bubble.parts].filter(
      /* `more` draws only on overflow, `stream-chunk` only while a word enters: both have tests of their own. */
      (part) => part !== 'root' && part !== 'more' && part !== 'stream-chunk',
    );
    for (const part of parts) {
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(screen.getByTestId('bubble')).toHaveAttribute('data-part', contract.rootPart.bubble);
  });

  it('names the article by its author', () => {
    render(everything());
    expect(screen.getByRole('article', { name: 'Marta Silva' })).toBe(screen.getByTestId('row'));
  });

  it('writes the delivery state as the shared state attributes', () => {
    const { rerender } = render(<Message data-testid="row" status="sending" />);
    const row = screen.getByTestId('row');
    expect(row).toHaveAttribute('aria-busy', 'true');
    expect(row).toHaveAttribute('data-loading', '');
    rerender(<Message data-testid="row" status="failed" />);
    expect(row).toHaveAttribute('data-invalid', '');
    expect(row).not.toHaveAttribute('aria-busy');
    rerender(<Message data-testid="row" status="read" />);
    expect(row).toHaveAttribute('data-read', '');
  });

  it('paints the reader’s own bubble in the accent’s fill unless the bubble says otherwise', () => {
    render(
      <>
        <Message align="end">
          <Bubble data-testid="own">
            <BubbleContent>a</BubbleContent>
          </Bubble>
          <Bubble data-testid="explicit" tone="success" variant="outline">
            <BubbleContent>b</BubbleContent>
          </Bubble>
        </Message>
        <Message layout="thread">
          <Bubble data-testid="thread">
            <BubbleContent>c</BubbleContent>
          </Bubble>
        </Message>
        <Bubble data-testid="alone">
          <BubbleContent>d</BubbleContent>
        </Bubble>
      </>,
    );
    expect(screen.getByTestId('own')).toHaveAttribute('data-variant', 'solid');
    expect(screen.getByTestId('own')).toHaveAttribute('data-tone', 'accent');
    expect(screen.getByTestId('explicit')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('explicit')).toHaveAttribute('data-tone', 'success');
    expect(screen.getByTestId('thread')).toHaveAttribute('data-variant', 'plain');
    expect(screen.getByTestId('alone')).toHaveAttribute(
      'data-variant',
      contract.members.bubble.defaults.variant,
    );
  });

  it('draws the receipt as a mark with a hidden word inside a bubble, and as the word alone outside', () => {
    render(
      <Message status="delivered">
        <Bubble>
          <BubbleContent>
            ok
            <BubbleMeta>
              <MessageReceipt data-testid="inside" />
            </BubbleMeta>
          </BubbleContent>
        </Bubble>
        <MessageFooter>
          <MessageReceipt data-testid="outside" status="failed" />
        </MessageFooter>
      </Message>,
    );
    const inside = screen.getByTestId('inside');
    expect(inside.querySelector('svg')).not.toBeNull();
    expect(inside).toHaveTextContent('Delivered');
    const outside = screen.getByTestId('outside');
    expect(outside.querySelector('svg')).toBeNull();
    expect(outside).toHaveTextContent('Not sent');
  });

  it('pages versions without wrapping, by pointer and by arrow, controlled and uncontrolled', () => {
    const onVersionChange = vi.fn();
    render(
      <Message onVersionChange={onVersionChange} versionCount={3}>
        <MessageVersions />
      </Message>,
    );
    const previous = screen.getByRole('button', { name: 'Previous version' });
    const next = screen.getByRole('button', { name: 'Next version' });
    expect(previous).toBeDisabled();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    fireEvent.click(next, { detail: 1 });
    expect(onVersionChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(onVersionChange).toHaveBeenLastCalledWith(
      2,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('holds a controlled version until the consumer moves it', () => {
    function Controlled() {
      const [version, setVersion] = useState(0);
      return (
        <>
          <Message onVersionChange={(next) => setVersion(next)} version={version} versionCount={2}>
            <MessageVersions />
          </Message>
          <output data-testid="out">{version}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Next version' }));
    expect(screen.getByTestId('out')).toHaveTextContent('1');
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('draws no pager for a message with one version', () => {
    render(
      <Message>
        <MessageVersions data-testid="versions" />
      </Message>,
    );
    expect(screen.queryByTestId('versions')).toBeNull();
  });

  it('asks the row to send a failed message again, with the reason', () => {
    const onRetry = vi.fn();
    render(
      <Message onRetry={onRetry} status="failed">
        <Bubble>
          <BubbleContent>and the invoice</BubbleContent>
          <BubbleRetry />
        </Bubble>
      </Message>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try sending again' }), { detail: 1 });
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ reason: 'pointer' }));
  });

  it('toggles a reaction the reader gives, and keeps the count the consumer states', () => {
    const onPressedChange = vi.fn();
    render(
      <Bubble>
        <BubbleContent>ok</BubbleContent>
        <BubbleReactions>
          <BubbleReaction count={3} onPressedChange={onPressedChange}>
            👍
          </BubbleReaction>
        </BubbleReactions>
      </Bubble>,
    );
    const reaction = screen.getByRole('button', { pressed: false });
    fireEvent.click(reaction, { detail: 1 });
    expect(reaction).toHaveAttribute('aria-pressed', 'true');
    expect(reaction).toHaveAttribute('data-pressed', '');
    expect(onPressedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(reaction).toHaveTextContent('3');
  });

  it('shows the more control only while a clamped text overflows, and keeps the text in the DOM', () => {
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    const client = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
    render(
      <Bubble data-testid="bubble" maxLines={3}>
        <BubbleContent>um texto muito longo</BubbleContent>
      </Bubble>,
    );
    const more = screen.getByRole('button', { name: 'Show more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(more);
    expect(screen.getByTestId('bubble')).toHaveAttribute('data-revealed', '');
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('um texto muito longo')).toBeInTheDocument();
    scroll.mockRestore();
    client.mockRestore();
  });

  it('writes the activity steps with the shared states, the current one marked as the step', () => {
    render(
      <Message>
        <MessageActivity>
          <MessageActivityStep status="complete">a</MessageActivityStep>
          <MessageActivityStep data-testid="now">b</MessageActivityStep>
        </MessageActivity>
      </Message>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('a').parentElement).toHaveAttribute('data-complete', '');
    expect(screen.getByTestId('now')).toHaveAttribute('data-current', '');
    expect(screen.getByTestId('now')).toHaveAttribute('aria-current', 'step');
  });

  it('names the typing dots and the quote jump, and runs the consumer’s own handlers', () => {
    const onJump = vi.fn();
    render(
      <Bubble>
        <BubbleContent>
          <BubbleQuote author="Tyler" onJump={onJump}>
            citado
          </BubbleQuote>
          <BubbleTyping />
          <BubbleTyping aria-label="Martha is typing" />
        </BubbleContent>
      </Bubble>,
    );
    expect(screen.getByRole('img', { name: 'Typing' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Martha is typing' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tyler/ }));
    expect(onJump).toHaveBeenCalled();
  });

  it('lets an application set the layout once, and a row lay its own words over the language', () => {
    render(
      <MessageDefaultsProvider actionsVisibility="always" layout="thread">
        <Message data-testid="row" messages={{ actions: 'Actions' }}>
          <MessageActions />
        </Message>
      </MessageDefaultsProvider>,
    );
    expect(screen.getByTestId('row')).toHaveAttribute('data-layout', 'thread');
    expect(screen.getByTestId('row')).toHaveAttribute('data-actions', 'always');
    expect(screen.getByRole('toolbar', { name: 'Actions' })).toBeInTheDocument();
  });

  it('speaks the language in force, the version label in its own word order', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Message versionCount={3}>
          <MessageVersions />
          <MessageActions />
        </Message>
      </SlottedProvider>,
    );
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    // language: pt-BR
    expect(screen.getByRole('toolbar', { name: 'Ações da mensagem' })).toBeInTheDocument();
    // language: en-US
  });

  it('keeps an explicit accessible name over the author', async () => {
    render(
      <Message aria-label="Mensagem de sistema">
        <MessageAuthor>Sistema</MessageAuthor>
      </Message>,
    );
    await act(async () => {});
    expect(screen.getByRole('article', { name: 'Mensagem de sistema' })).toBeInTheDocument();
  });
});

describe('BubbleStream', () => {
  const reply = (text: string, status?: 'streaming') => (
    <Message aria-label="Assistente" {...(status === undefined ? {} : { status })}>
      <MessageBody>
        <Bubble>
          <BubbleContent>
            <BubbleStream data-testid="stream" text={text} />
          </BubbleContent>
        </Bubble>
      </MessageBody>
    </Message>
  );

  it('paints a finished reply as plain text, with nothing entering', () => {
    render(reply('O p95 voltou a 260 ms.'));
    const stream = screen.getByTestId('stream');
    expect(stream).toHaveTextContent('O p95 voltou a 260 ms.');
    expect(stream.querySelector('[data-part="stream-chunk"]')).toBeNull();
  });

  it('puts every word that arrives in the DOM at once, each entering after its delay', () => {
    const { rerender } = render(reply('The ', 'streaming'));
    rerender(reply('The tax service', 'streaming'));
    const stream = screen.getByTestId('stream');
    expect(stream).toHaveTextContent('The tax service');
    const chunks = [...stream.querySelectorAll<HTMLElement>('[data-part="stream-chunk"]')];
    expect(chunks.map((chunk) => chunk.textContent)).toEqual(['tax ', 'service']);
    const delays = chunks.map((chunk) => Number.parseFloat(chunk.style.animationDelay));
    expect(delays.slice(1).every((delay, index) => delay > (delays[index] ?? 0))).toBe(true);
  });

  it('folds a word back into the text once it has entered', () => {
    const { rerender } = render(reply('', 'streaming'));
    rerender(reply('um dois', 'streaming'));
    const stream = screen.getByTestId('stream');
    const last = [...stream.querySelectorAll('[data-part="stream-chunk"]')].at(-1);
    if (last === undefined) throw new Error('no chunk entering');
    /* jsdom has no AnimationEvent, so React listens for the prefixed name there. */
    fireEvent(last, new Event('webkitAnimationEnd', { bubbles: true }));
    expect(stream.querySelector('[data-part="stream-chunk"]')).toBeNull();
    expect(stream).toHaveTextContent('um dois');
  });

  it('replaces a reply that does not extend the one received, at once', () => {
    const { rerender } = render(reply('First version', 'streaming'));
    rerender(reply('Another', 'streaming'));
    const stream = screen.getByTestId('stream');
    expect(stream).toHaveTextContent(/^Another$/);
    expect(stream.querySelector('[data-part="stream-chunk"]')).toBeNull();
  });
});
