import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Glyph, Icon } from '@slotted/react/icon';

export default function AlertMarkup() {
  return (
    <Alert
      icon={
        <Icon>
          <Glyph name="calendar" />
        </Icon>
      }
      reach="page"
      tone="secondary"
    >
      <AlertContent>
        <AlertTitle render={(props) => <h3 {...props} />}>Rotterdam warehouse is closed</AlertTitle>
        <AlertDescription>Orders ship from Antwerp until Monday.</AlertDescription>
      </AlertContent>
    </Alert>
  );
}
