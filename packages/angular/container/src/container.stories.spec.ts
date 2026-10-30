import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/container/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_CONTAINER_DOCS } from './container.docs';
import * as containerStories from './container.stories';

describe('Angular Container stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.container, containerStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(contract.members.container, ANGULAR_CONTAINER_DOCS.container.api),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    expect(await snippetFormatErrors([...ANGULAR_CONTAINER_DOCS.container.snippets])).toEqual([]);
  });
});
