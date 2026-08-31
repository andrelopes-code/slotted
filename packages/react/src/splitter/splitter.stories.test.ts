import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/splitter/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_SPLITTER_DOCS } from './splitter.docs';
import * as splitterStories from './splitter.stories';

describe('Splitter stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.splitter, splitterStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_SPLITTER_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_SPLITTER_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_SPLITTER_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
