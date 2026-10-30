import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/list-item/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_LIST_ITEM_DOCS } from './list-item.docs';
import * as listItemStories from './list-item.stories';

describe('List Item stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.listItem, listItemStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_LIST_ITEM_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], REACT_LIST_ITEM_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_LIST_ITEM_DOCS.listItem,
        framework: 'React',
        member: contract.members.listItem,
        scenarioIds: contract.scenarios.listItem,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_LIST_ITEM_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
