import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/icon/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import * as iconStories from './icon.stories';
import { REACT_ICON_DOCS } from './icon.docs';

describe('Icon stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.icon, iconStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.icon, REACT_ICON_DOCS.icon.api)).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    expect(await snippetFormatErrors(REACT_ICON_DOCS.icon.snippets)).toEqual([]);
  });
});
