import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/stack/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_STACK_DOCS } from './stack.docs';
import * as stackStories from './stack.stories';

describe('Stack stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.stack, stackStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.stack, REACT_STACK_DOCS.stack.api)).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    expect(await snippetFormatErrors([...REACT_STACK_DOCS.stack.snippets])).toEqual([]);
  });
});
