import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/inline/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_INLINE_DOCS } from './inline.docs';
import * as inlineStories from './inline.stories';

describe('Angular Inline stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.inline, inlineStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.inline, ANGULAR_INLINE_DOCS.inline.api)).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    expect(await snippetFormatErrors([...ANGULAR_INLINE_DOCS.inline.snippets])).toEqual([]);
  });
});
