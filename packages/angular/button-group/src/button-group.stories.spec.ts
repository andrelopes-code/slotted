import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button-group/contract.json';
import { ANGULAR_BUTTON_GROUP_DOCS } from './button-group.docs';
import * as buttonGroupStories from './button-group.stories';

describe('Angular ButtonGroup stories', () => {
  it('covers every scenario the member declares', () => {
    expect(scenarioCoverageErrors(contract.scenarios.buttonGroup, buttonGroupStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(contract.members.buttonGroup, ANGULAR_BUTTON_GROUP_DOCS.buttonGroup.api),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    expect(await snippetFormatErrors([...ANGULAR_BUTTON_GROUP_DOCS.buttonGroup.snippets])).toEqual(
      [],
    );
  });
});
