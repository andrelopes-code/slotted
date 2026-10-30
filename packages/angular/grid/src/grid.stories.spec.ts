import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/grid/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_GRID_DOCS } from './grid.docs';
import * as gridStories from './grid.stories';

describe('Angular Grid stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.grid, gridStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.grid, ANGULAR_GRID_DOCS.grid.api)).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    expect(await snippetFormatErrors([...ANGULAR_GRID_DOCS.grid.snippets])).toEqual([]);
  });
});
