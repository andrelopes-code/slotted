import { splitWords } from '@slotted/core/text-stream';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar } from '../avatar';
import { IconButton } from '../button';
import { Glyph, Icon } from '../icon';
import {
  Bubble,
  BubbleContent,
  BubbleMeta,
  Message,
  MessageActions,
  MessageAvatar,
  MessageBody,
  MessageReceipt,
  MessageTime,
} from './index';
import type { MessageProps, MessageStatus } from './index';

/**
 * One product for every page: a payments support desk, where Marta Silva from
 * the operations team and the reader resolve a payout returned by the bank.
 */
export const MARTA = 'Marta Silva';
export const ASSISTANT = 'Assistente';

export const LONG_ANSWER =
  'Checkout slowed down at 21:40 because the connection pool hit its ceiling and every new request queued behind one that was already running. The payments worker had replayed a batch of 1200 webhooks after a processor timeout, and each replay opened its own connection. We raised the pool to 60 and capped the worker at 8 simultaneous deliveries; p95 went back below 400 ms four minutes later.';

export const DRAFTS = [
  '4.2 moves billing to the new tax service, so EU orders carry the VAT line in the PDF, in the receipt and in the CSV export.',
  'The highlight of 4.2 is EU VAT: calculated per order rather than per account, and visible wherever an amount appears.',
  'In 4.2, EU orders now show VAT; the portal remembers filters and a failed payment only becomes overdue after two attempts.',
];

/** Rows of a conversation take the whole width of the column they stand in. */
export function Stack({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-stack" data-stretch="">
      {children}
    </div>
  );
}

/** Marta's side: the secondary tint, her avatar at the foot. */
export function Theirs({
  avatar = true,
  children,
  time,
  ...props
}: Omit<MessageProps, 'children'> & { avatar?: boolean; children: ReactNode; time?: string }) {
  return (
    <Message aria-label={MARTA} {...props}>
      {avatar ? (
        <MessageAvatar>
          <Avatar name={MARTA} size="sm" />
        </MessageAvatar>
      ) : null}
      <MessageBody>
        <Bubble>
          <BubbleContent>
            {children}
            {time === undefined ? null : (
              <BubbleMeta>
                <MessageTime dateTime={`2026-09-30T${time}`}>{time}</MessageTime>
              </BubbleMeta>
            )}
          </BubbleContent>
        </Bubble>
      </MessageBody>
    </Message>
  );
}

/** The reader's own side: the accent's fill, the hour and the receipt inside. */
export function Mine({
  children,
  status = 'read',
  time = '09:41',
  ...props
}: Omit<MessageProps, 'children' | 'status'> & {
  children: ReactNode;
  status?: Exclude<MessageStatus, 'streaming'>;
  time?: string;
}) {
  return (
    <Message align="end" aria-label="Tu" status={status} {...props}>
      <MessageBody>
        <Bubble>
          <BubbleContent>
            {children}
            <BubbleMeta>
              {status === 'sending' ? null : (
                <MessageTime dateTime={`2026-09-30T${time}`}>{time}</MessageTime>
              )}
              <MessageReceipt />
            </BubbleMeta>
          </BubbleContent>
        </Bubble>
      </MessageBody>
    </Message>
  );
}

/** The actions an assistant's reply carries. */
export function ReplyActions() {
  return (
    <MessageActions>
      <IconButton aria-label="Copiar" size="sm" variant="ghost">
        <Icon>
          <Glyph name="copy" />
        </Icon>
      </IconButton>
      <IconButton aria-label="Gerar de novo" size="sm" variant="ghost">
        <Icon>
          <Glyph name="rotate-ccw" />
        </Icon>
      </IconButton>
    </MessageActions>
  );
}

export const STREAM =
  'The tax service started repeating every confirmation at 14:05, twice at 400 ms each, so the p95 of POST /api/checkout/confirm went from 240 ms to 3.1 s.\n\nThe database was never the bottleneck: connections stayed below 40% throughout the incident. I turned off the retries in the service client and p95 went back to 260 ms within two minutes.';

/**
 * A transport as a model serves one: mostly a word every few tens of
 * milliseconds, now and then a pause and a burst of several words at once.
 * The pattern is fixed, so every replay arrives the same way.
 */
const BURSTS = [1, 1, 2, 1, 1, 3, 1, 7, 1, 2, 1, 1, 1, 12, 2, 1, 1, 4, 1, 1, 2, 9];
const PAUSES = [45, 30, 60, 35, 40, 50, 30, 240, 40, 35, 55, 30, 45, 380, 40, 30, 50, 120];

/** The text of `STREAM` received so far, arriving in bursts, and a way to start again. */
export function useSimulatedStream(text: string = STREAM) {
  const [received, setReceived] = useState(0);
  const [run, setRun] = useState(0);
  const words = splitWords(text);
  useEffect(() => {
    setReceived(0);
    let index = 0;
    let tick = 0;
    let timer = 0;
    const next = () => {
      index = Math.min(words.length, index + (BURSTS[tick % BURSTS.length] ?? 1));
      setReceived(index);
      if (index < words.length) {
        timer = window.setTimeout(next, PAUSES[tick % PAUSES.length] ?? 40);
        tick += 1;
      }
    };
    timer = window.setTimeout(next, 400);
    return () => window.clearTimeout(timer);
    // The words are derived from `text`; a new run restarts the same text.
  }, [text, run]);
  const replay = useCallback(() => setRun((value) => value + 1), []);
  return { text: words.slice(0, received).join(''), done: received >= words.length, replay };
}
