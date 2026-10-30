import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/otp-input/contract.json';
import { REACT_OTP_INPUT_DOCS } from './otp-input.docs';
import * as otpInputStories from './otp-input.stories';

describe('OtpInput stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.otpInput, otpInputStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.otpInput,
        REACT_OTP_INPUT_DOCS.otpInput.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  /**
   * The family holds one mutable value, so the page owes an event table as
   * well as the import, the anatomy and one captioned demonstration per
   * scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_OTP_INPUT_DOCS.otpInput,
        framework: 'React',
        member: contract.members.otpInput,
        scenarioIds: contract.scenarios.otpInput,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_OTP_INPUT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
