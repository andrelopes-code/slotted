import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import * as alertDialogStories from './alert-dialog.stories';
import * as dialogStories from './dialog.stories';

/**
 * What a reference page owes the page it is drawn on.
 *
 * A modal layer takes the document over: `dismissable-layer` writes `inert` on
 * every sibling up to the root and locks the document scroll, and `focus` pulls
 * the keyboard into the panel. That is correct for one dialog in an application
 * and wrong for a documentation page carrying a dozen demonstrations at once —
 * the first published version of these stories locked the scroll twelve times,
 * inerted everything, and emptied itself on the first press anywhere, because
 * every open panel read that press as a press outside itself.
 *
 * Nothing offline could see it: every story test passed, the snippets were
 * formatted, the scenario coverage was complete. It was found by a reader
 * opening the page. This is the check that would have found it first.
 */
type StoryModule = Record<string, { render?: (args: unknown, context: unknown) => unknown }>;

function stories(module: StoryModule) {
  return Object.entries(module).filter(
    ([name, value]) =>
      name !== 'default' && typeof value === 'object' && value !== null && 'render' in value,
  );
}

/** What Storybook hands a render function. Nothing here reads more than args. */
const context = { args: {}, argTypes: {}, globals: {}, parameters: {} } as unknown;

afterEach(() => {
  document.body.removeAttribute('style');
});

describe.each([
  ['Dialog', dialogStories as StoryModule],
  ['AlertDialog', alertDialogStories as StoryModule],
])('%s reference page', (_name, module) => {
  const cases = stories(module).map(([name, story]) => [name, story] as const);

  it.each(cases)('leaves the page it is drawn on scrollable: %s', (_storyName, story) => {
    const args = 'args' in story ? (story as { args: unknown }).args : {};
    render(story.render?.(args, context) as never);

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it.each(cases)('makes nothing outside itself inert: %s', (_storyName, story) => {
    const args = 'args' in story ? (story as { args: unknown }).args : {};
    render(story.render?.(args, context) as never);

    /*
     * The top level, which is where `applyInert` ends up: it walks from the
     * layer to the document root and marks every sibling on the way. A family's
     * own `inert` on something it owns — a closed layer, a skeleton standing in
     * for content — is not that and is not what this is about.
     */
    const inert = [...document.body.children].filter((node) => node.hasAttribute('inert'));

    expect(inert.map((node) => node.tagName)).toEqual([]);
  });

  /**
   * One press anywhere on the page closed every open panel at once, because each
   * of them read it as a press outside itself. A still demonstration answers no
   * dismissal at all.
   */
  it.each(cases)('survives a press on the page around it: %s', (_storyName, story) => {
    const args = 'args' in story ? (story as { args: unknown }).args : {};
    render(story.render?.(args, context) as never);

    const before = document.querySelectorAll('[data-part="content"]').length;
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(document.querySelectorAll('[data-part="content"]')).toHaveLength(before);
  });
});
