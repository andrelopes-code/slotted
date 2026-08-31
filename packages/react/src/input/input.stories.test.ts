import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/input/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_INPUT_DOCS } from './input.docs';
import * as inputStories from './input.stories';

describe('Input stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.input, inputStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_INPUT_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_INPUT_DOCS[member].api)).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_INPUT_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
