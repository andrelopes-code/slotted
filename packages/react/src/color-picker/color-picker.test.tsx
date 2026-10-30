import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { ColorField, ColorPicker } from './color-picker';
import { ColorPickerDefaultsProvider } from './color-picker-defaults';

const root = () =>
  document.querySelector<HTMLElement>('[data-ui="color-picker"][data-part="root"]')!;
const slider = (name: string) => screen.getByRole('slider', { name });

describe('ColorPicker', () => {
  it('draws the whole anatomy and writes the colour as runtime properties', () => {
    render(
      <ColorPicker
        contrastWith="#FFFFFF"
        defaultValue="#2563EB"
        presets={['#2563EB', '#DC2626']}
      />,
    );
    for (const part of [
      'area',
      'area-thumb',
      'channel',
      'channel-thumb',
      'row',
      'swatch',
      'previous',
      'presets',
      'preset',
      'contrast',
    ]) {
      expect(root().querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(Number(root().style.getPropertyValue('--slotted-color-picker-hue'))).toBeCloseTo(221, 0);
    expect(root()).toHaveAttribute('data-format', 'hex');
  });

  it('moves the hue with the slider keys and answers in the same notation', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="hsl(200 50% 50%)" onValueChange={onValueChange} />);
    fireEvent.keyDown(slider('Hue'), { key: 'ArrowRight' });
    const [value, request] = onValueChange.mock.calls[0]!;
    expect(value).toMatch(/^hsl\(201 /);
    expect(request.reason).toBe('keyboard');
    fireEvent.keyDown(slider('Hue'), { key: 'End' });
    expect(onValueChange.mock.calls.at(-1)![0]).toMatch(/^hsl\(0 |^hsl\(360 /);
  });

  it('moves brightness up and saturation along the reading direction from the area', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#808080" format="hsl" onValueChange={onValueChange} />);
    fireEvent.keyDown(slider('Saturation and brightness'), { key: 'ArrowUp', shiftKey: true });
    expect(onValueChange).toHaveBeenCalled();
    fireEvent.keyDown(slider('Saturation and brightness'), { key: 'ArrowRight' });
    expect(onValueChange.mock.calls.at(-1)![1].reason).toBe('keyboard');
  });

  it('takes alpha to nothing with Home, and writes it in the value', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#2563EB" format="rgb" onValueChange={onValueChange} />);
    fireEvent.keyDown(slider('Opacity'), { key: 'Home' });
    expect(onValueChange.mock.calls[0]![0]).toBe('rgb(37 99 235 / 0%)');
  });

  it('draws no alpha channel when alpha is off', () => {
    render(<ColorPicker alpha={false} defaultValue="#2563EB" />);
    expect(screen.queryByRole('slider', { name: 'Opacity' })).toBeNull();
  });

  it('holds a colour still being typed, and commits it in the current notation', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#2563EB" onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Color' });
    fireEvent.change(input, { target: { value: 'rgb(220 38' } });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(input, { target: { value: 'rgb(220 38 38)' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange.mock.calls[0]![0]).toBe('#DC2626');
  });

  it('marks its text input invalid when the picker is, so the frame draws the invalid edge', () => {
    render(<ColorPicker defaultValue="#2563EB" invalid />);
    const input = screen.getByRole('textbox', { name: 'Color' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.closest('[data-ui="text-field"]')).toHaveAttribute('data-invalid', '');
  });

  it('puts back the last valid colour when the text is abandoned', () => {
    render(<ColorPicker defaultValue="#2563EB" />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Color' });
    fireEvent.change(input, { target: { value: 'azul' } });
    fireEvent.blur(input);
    expect(input.value).toBe('#2563EB');
  });

  it('chooses a preset with the reason select, as a radio group', () => {
    const onValueChange = vi.fn();
    render(
      <ColorPicker
        defaultValue="#2563EB"
        onValueChange={onValueChange}
        presets={['#2563EB', '#DC2626']}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Presets' });
    expect(within(group).getByRole('radio', { name: '#2563EB' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(within(group).getByRole('radio', { name: '#DC2626' }));
    expect(onValueChange.mock.calls[0]).toEqual([
      '#DC2626',
      expect.objectContaining({ reason: 'select' }),
    ]);
  });

  it('restores the colour it opened with', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker onValueChange={onValueChange} value="#DC2626" />);
    fireEvent.click(screen.getByRole('button', { name: 'Restore #DC2626' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('measures the contrast and says the level in words', () => {
    render(<ColorPicker contrastWith="#FFFFFF" defaultValue="#2563EB" />);
    const contrast = root().querySelector('[data-part="contrast"]')!;
    expect(contrast).toHaveAttribute('data-level', 'AA');
    expect(contrast).toHaveTextContent('5.17:1');
  });

  it('says a colour lies outside sRGB instead of converting it', () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="oklch(0.9 0.3 150)" onValueChange={onValueChange} />);
    expect(root()).toHaveAttribute('data-out-of-gamut');
    expect(root()).toHaveAttribute('data-format', 'oklch');
    expect(screen.getByRole('status')).toHaveTextContent('Outside sRGB');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('draws only the parts it is given', () => {
    render(
      <ColorPicker defaultValue="#2563EB">
        <span data-testid="custom" />
      </ColorPicker>,
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('takes its palette from the provider', () => {
    render(
      <ColorPickerDefaultsProvider presets={['#16A34A']}>
        <ColorPicker defaultValue="#16A34A" />
      </ColorPickerDefaultsProvider>,
    );
    expect(screen.getByRole('radio', { name: '#16A34A' })).toBeInTheDocument();
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <ColorPicker contrastWith="#FFFFFF" defaultValue="#FFFF00" messages={{ hue: 'Tom' }} />
      </SlottedProvider>,
    );
    expect(screen.getByRole('slider', { name: 'Tom' })).toBeInTheDocument();
    // language: pt-BR
    expect(screen.getByRole('slider', { name: 'Saturação e brilho' })).toHaveAttribute(
      // language: en-US
      'aria-roledescription',
      'controle deslizante 2D',
    );
    expect(screen.getByRole('button', { name: 'Restaurar #FFFF00' })).toBeInTheDocument();
    expect(root().querySelector('[data-part="contrast-level"]')).toHaveTextContent('Insuficiente');
  });
});

describe('ColorField', () => {
  it('commits a typed colour in its notation and paints the swatch', () => {
    const onValueChange = vi.fn();
    render(
      <ColorField aria-label="Primary" defaultValue="#2563EB" onValueChange={onValueChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'Primary' });
    fireEvent.change(input, { target: { value: 'hsl(0 72% 51%)' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange.mock.calls[0]![0]).toBe('#DC2828');
    const trigger = screen.getByRole('button', { name: 'Choose a color' });
    expect(trigger).toHaveAttribute('data-part', 'trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('opens the panel from the swatch', () => {
    render(<ColorField aria-label="Primary" defaultValue="#2563EB" />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose a color' }));
    expect(screen.getByRole('slider', { name: 'Hue' })).toBeInTheDocument();
  });
});
