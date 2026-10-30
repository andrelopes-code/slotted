import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/visually-hidden/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_VISUALLY_HIDDEN_DOCS } from './visually-hidden.docs';
import * as visuallyHiddenStories from './visually-hidden.stories';

describe('VisuallyHidden stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.visuallyHidden, visuallyHiddenStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_VISUALLY_HIDDEN_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_VISUALLY_HIDDEN_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_VISUALLY_HIDDEN_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
