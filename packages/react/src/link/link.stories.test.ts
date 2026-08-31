import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/link/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_LINK_DOCS } from './link.docs';
import * as linkStories from './link.stories';

describe('Link stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.link, linkStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_LINK_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_LINK_DOCS[member].api)).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_LINK_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
