import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';

export default function AlertBasic() {
  return (
    <Alert>
      <AlertContent>
        <AlertTitle>Spring price list is live</AlertTitle>
        <AlertDescription>
          The new prices took effect for 1,240 products at 6:00 AM.
        </AlertDescription>
      </AlertContent>
    </Alert>
  );
}
