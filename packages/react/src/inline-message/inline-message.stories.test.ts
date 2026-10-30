import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/inline-message/contract.json';
import { REACT_INLINE_MESSAGE_DOCS } from './inline-message.docs';
import * as inlineMessageStories from './inline-message.stories';

describe('InlineMessage stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.inlineMessage, inlineMessageStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_INLINE_MESSAGE_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_INLINE_MESSAGE_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it. No event table is required, and the absence is the
   * contract's rather than an oversight — the family holds no mutable value, so
   * it declares no state model and emits nothing.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_INLINE_MESSAGE_DOCS.inlineMessage,
        framework: 'React',
        member: contract.members.inlineMessage,
        scenarioIds: contract.scenarios.inlineMessage,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_INLINE_MESSAGE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
