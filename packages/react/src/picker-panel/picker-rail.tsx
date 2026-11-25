import { pickerPanelMessages } from '@slotted/core/i18n';
import type { MouseEvent, ReactNode } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';

/** A shortcut as the rail draws it: its name, and what a press writes, in words. */
export interface PickerPresetView {
  readonly disabled: boolean;
  readonly label: string;
  readonly onPress: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly result: string;
  readonly selected: boolean;
}

interface PickerRailProps {
  readonly children?: ReactNode;
  readonly presets: readonly PickerPresetView[];
}

/** The column of shortcuts. The groups under them are its children. */
export function PickerRail({ children, presets }: PickerRailProps) {
  const t = useMessages(pickerPanelMessages);

  return (
    <div data-part="rail" data-part-rail="">
      {presets.length > 0 && (
        <div aria-label={t('presets')} data-part="presets" data-part-presets="" role="group">
          {presets.map((preset) => (
            <button
              aria-pressed={preset.selected}
              data-part="preset"
              data-part-preset=""
              disabled={preset.disabled}
              key={preset.label}
              onClick={preset.onPress}
              type="button"
              {...(preset.selected ? { 'data-selected': '' } : {})}
            >
              <span data-part="preset-label" data-part-preset-label="">
                {preset.label}
              </span>
              <span data-part="preset-result" data-part-preset-result="">
                {preset.result}
              </span>
              {preset.selected && (
                <Icon>
                  <Glyph name="check" />
                </Icon>
              )}
            </button>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
