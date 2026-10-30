import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/message/contract.json';
import * as bubbleStories from './bubble.stories';
import * as overviewStories from './message-family.stories';
import { REACT_MESSAGE_DOCS } from './message.docs';
import * as messageStories from './message.stories';

const storyModules = {
  overview: overviewStories,
  message: messageStories,
  bubble: bubbleStories,
};

type Member = keyof typeof contract.members;
const members = Object.keys(contract.members) as Member[];

describe('Message family stories', () => {
  it('covers every required scenario, on every page', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of members) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_MESSAGE_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract for each member', () => {
    for (const member of members) {
      expect(
        referencePageErrors({
          docs: REACT_MESSAGE_DOCS[member],
          framework: 'React',
          member: contract.members[member],
          scenarioIds: contract.scenarios[member],
          stateModel: contract.stateModel,
        }),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_MESSAGE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
