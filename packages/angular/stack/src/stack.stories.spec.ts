import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/stack/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_STACK_DOCS } from './stack.docs';
import * as stackStories from './stack.stories';

describe('Angular Stack stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.stack, stackStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.stack, ANGULAR_STACK_DOCS.stack.api)).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    expect(await snippetFormatErrors([...ANGULAR_STACK_DOCS.stack.snippets])).toEqual([]);
  });
});
