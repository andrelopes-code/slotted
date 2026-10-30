/** A value a message is filled with: a number is written in the locale's digits. */
export type SlotValue = string | number;

export type MessageSlots = Readonly<Record<string, SlotValue>>;

/** A message written as code: the integration point for an application's own i18n. */
export type MessageFn<S extends MessageSlots = MessageSlots> = (slots: S, locale: string) => string;

/**
 * One text the library writes. A string is read by the message grammar
 * (`formatMessage`); a function receives the slots and the locale.
 */
export type Message<S extends MessageSlots = MessageSlots> = string | MessageFn<S>;

/** A family's messages: a key holds a message or a record of them (`filterOperators`). */
export interface MessageRecord {
  readonly [key: string]: Message<never> | MessageRecord;
}

/** The slots a message reads, from the function form its type declares. */
export type SlotsOf<M> = [Extract<M, MessageFn<never>>] extends [MessageFn<infer S>]
  ? S
  : MessageSlots;

/** Every key of a family's messages, a nested one written `group.key`. */
export type MessageKey<M> = {
  [K in keyof M & string]: M[K] extends Message<never> ? K : `${K}.${keyof M[K] & string}`;
}[keyof M & string];

/** The message type at a key path. */
export type MessageAt<M, P extends string> = P extends `${infer G}.${infer K}`
  ? G extends keyof M
    ? K extends keyof M[G]
      ? M[G][K]
      : never
    : never
  : P extends keyof M
    ? M[P]
    : never;

/** A family's messages with every key and every record entry optional. */
export type PartialMessages<M> = {
  readonly [K in keyof M]?: M[K] extends Message<never> ? M[K] : Partial<M[K]>;
};
