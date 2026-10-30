import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';

const stock = [
  { term: 'On hand', value: '39 units' },
  { term: 'Reserved', value: '12 units' },
  { term: 'Reorder point', value: '25 units' },
  { term: 'Next delivery', value: 'Oct 14, Exotic Liquids' },
];

export default function PopoverBasic() {
  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Chai stock
          </Button>
        )}
      />
      <PopoverLayer>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Chai</PopoverTitle>
            <PopoverDescription>SKU NW-1001, Seattle warehouse</PopoverDescription>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody>
            <DescriptionList>
              {stock.map((row) => (
                <DescriptionListItem key={row.term}>
                  <DescriptionListTerm>{row.term}</DescriptionListTerm>
                  <DescriptionListDescription>{row.value}</DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
          </PopoverBody>
        </PopoverContent>
        <PopoverArrow />
      </PopoverLayer>
    </Popover>
  );
}
