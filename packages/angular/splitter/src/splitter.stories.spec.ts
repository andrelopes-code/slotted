import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/splitter/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_SPLITTER_DOCS } from './splitter.docs';
import * as splitterStories from './splitter.stories';

describe('Angular Splitter stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.splitter, splitterStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_SPLITTER_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_SPLITTER_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_SPLITTER_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
