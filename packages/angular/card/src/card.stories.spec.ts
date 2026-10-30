import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/card/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_CARD_DOCS } from './card.docs';
import * as cardStories from './card.stories';

describe('Angular Card stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.card, cardStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_CARD_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_CARD_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_CARD_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
