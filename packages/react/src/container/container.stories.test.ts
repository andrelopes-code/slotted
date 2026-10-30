import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/container/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_CONTAINER_DOCS } from './container.docs';
import * as containerStories from './container.stories';

describe('Container stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.container, containerStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(contract.members.container, REACT_CONTAINER_DOCS.container.api),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    expect(await snippetFormatErrors([...REACT_CONTAINER_DOCS.container.snippets])).toEqual([]);
  });
});
