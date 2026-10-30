import { Button } from '@slotted/react/button';
import { toast, ToastRegion } from '@slotted/react/toast';

export default function ToastBasic() {
  return (
    <>
      {/* Once, near the root of the application. */}
      <ToastRegion />
      <Button
        onClick={() =>
          toast.show({ title: 'Draft saved', description: 'Everything since 2:02 PM is saved.' })
        }
      >
        Save draft
      </Button>
    </>
  );
}
