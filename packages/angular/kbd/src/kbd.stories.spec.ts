import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/kbd/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_KBD_DOCS } from './kbd.docs';
import * as kbdStories from './kbd.stories';

describe('Angular Kbd stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.kbd, kbdStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_KBD_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_KBD_DOCS[member].api)).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_KBD_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
