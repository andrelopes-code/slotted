import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/typography/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import * as headingStories from './heading.stories';
import * as textStories from './text.stories';
import { REACT_TYPOGRAPHY_DOCS } from './typography.docs';

describe('Typography stories', () => {
  it('covers every scenario each member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.text, textStories)).toEqual([]);
    expect(scenarioCoverageErrors(contract.scenarios.heading, headingStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_TYPOGRAPHY_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_TYPOGRAPHY_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TYPOGRAPHY_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
