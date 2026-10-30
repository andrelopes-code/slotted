export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Across the flow. `auto` is a value rather than an absent one: a joined bar
 * takes one block size across its flow on either axis, so a consumer who
 * mixes sizes gets a ragged width rather than a ragged edge, and the four
 * explicit values are the consumer overruling that.
 */
export type ButtonGroupAlign = 'auto' | 'start' | 'center' | 'end' | 'stretch';

/** Along the flow. Asking for it makes the group hold the line it distributes. */
export type ButtonGroupJustify = 'start' | 'center' | 'end' | 'between';
