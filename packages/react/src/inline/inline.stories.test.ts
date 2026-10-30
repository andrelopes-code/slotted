import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/inline/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_INLINE_DOCS } from './inline.docs';
import * as inlineStories from './inline.stories';

describe('Inline stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.inline, inlineStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.inline, REACT_INLINE_DOCS.inline.api)).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    expect(await snippetFormatErrors([...REACT_INLINE_DOCS.inline.snippets])).toEqual([]);
  });
});
