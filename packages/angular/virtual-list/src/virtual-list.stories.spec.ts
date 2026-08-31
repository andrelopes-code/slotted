import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/virtual-list/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_VIRTUAL_LIST_DOCS } from './virtual-list.docs';
import * as virtualListStories from './virtual-list.stories';

describe('Angular VirtualList stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.virtualList, virtualListStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_VIRTUAL_LIST_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_VIRTUAL_LIST_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_VIRTUAL_LIST_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
