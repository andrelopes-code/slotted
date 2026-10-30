import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/icon/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import * as iconStories from './icon.stories';
import { ANGULAR_ICON_DOCS } from './icon.docs';

describe('Angular Icon stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.icon, iconStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.icon, ANGULAR_ICON_DOCS.icon.api)).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    expect(await snippetFormatErrors(ANGULAR_ICON_DOCS.icon.snippets)).toEqual([]);
  });
});
