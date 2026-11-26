import { Glyph } from '@slotted/react/icon';
import { Toggle } from '@slotted/react/toggle';

export default function ToggleBasic() {
  return <Toggle icon={<Glyph name="pin" />}>Pin header</Toggle>;
}
