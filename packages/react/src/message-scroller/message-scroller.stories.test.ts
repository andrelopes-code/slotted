import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/message-scroller/contract.json';
import { REACT_MESSAGE_SCROLLER_DOCS } from './message-scroller.docs';
import * as stories from './message-scroller.stories';

const docs = REACT_MESSAGE_SCROLLER_DOCS.messageScroller;
const member = contract.members.messageScroller;

describe('MessageScroller stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.messageScroller, stories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(apiMetadataErrors(member, docs.api)).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs,
        framework: 'React',
        member,
        scenarioIds: contract.scenarios.messageScroller,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [...docs.snippets, ...docs.scenes.map((scene) => scene.snippet)];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
