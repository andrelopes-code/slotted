import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/collapsible/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_COLLAPSIBLE_DOCS } from './collapsible.docs';
import * as collapsibleStories from './collapsible.stories';

describe('Angular Collapsible stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.collapsible, collapsibleStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_COLLAPSIBLE_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_COLLAPSIBLE_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_COLLAPSIBLE_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
