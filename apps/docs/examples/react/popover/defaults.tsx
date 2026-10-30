import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverDefaultsProvider,
  PopoverLayer,
  PopoverTrigger,
} from '@slotted/react/popover';

const terms = [
  { label: 'Net 30', text: 'Payment is due 30 days after the invoice date.' },
  { label: 'Net 60', text: 'Payment is due 60 days after the invoice date.' },
];

export default function PopoverDefaults() {
  return (
    <PopoverDefaultsProvider arrow={false} size="sm">
      <Inline gap={3} justify="center" wrap="wrap">
        {terms.map((term) => (
          <Popover key={term.label}>
            <PopoverTrigger
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  {term.label}
                </Button>
              )}
            />
            <PopoverLayer>
              <PopoverContent aria-label={term.label}>
                <PopoverBody>{term.text}</PopoverBody>
              </PopoverContent>
              <PopoverArrow />
            </PopoverLayer>
          </Popover>
        ))}
        <Popover arrow>
          <PopoverTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Cash in advance
              </Button>
            )}
          />
          <PopoverLayer>
            <PopoverContent aria-label="Cash in advance">
              <PopoverBody>The order ships once the payment has cleared.</PopoverBody>
            </PopoverContent>
            <PopoverArrow />
          </PopoverLayer>
        </Popover>
      </Inline>
    </PopoverDefaultsProvider>
  );
}
