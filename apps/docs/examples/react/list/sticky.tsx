import { List, ListSection } from '@slotted/react/list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemEnd,
  ListItemLabel,
} from '@slotted/react/list-item';
import { ScrollArea } from '@slotted/react/scroll-area';

const DAYS = [
  {
    day: 'Monday',
    moves: [
      { id: 'MV-801', sku: 'Oat flour, 25 kg', quantity: '+40' },
      { id: 'MV-802', sku: 'Rye flour, 25 kg', quantity: '+24' },
      { id: 'MV-803', sku: 'Sea salt, 5 kg', quantity: '−12' },
      { id: 'MV-804', sku: 'Cane sugar, 10 kg', quantity: '−30' },
    ],
  },
  {
    day: 'Tuesday',
    moves: [
      { id: 'MV-805', sku: 'Oat flour, 25 kg', quantity: '−18' },
      { id: 'MV-806', sku: 'Dried yeast, 500 g', quantity: '+60' },
      { id: 'MV-807', sku: 'Butter, 10 kg', quantity: '−8' },
      { id: 'MV-808', sku: 'Sea salt, 5 kg', quantity: '+20' },
    ],
  },
  {
    day: 'Wednesday',
    moves: [
      { id: 'MV-809', sku: 'Rye flour, 25 kg', quantity: '−16' },
      { id: 'MV-810', sku: 'Cane sugar, 10 kg', quantity: '+45' },
      { id: 'MV-811', sku: 'Butter, 10 kg', quantity: '+12' },
      { id: 'MV-812', sku: 'Dried yeast, 500 g', quantity: '−22' },
    ],
  },
];

export default function ListSticky() {
  return (
    <ScrollArea maxBlockSize="16rem" messages={{ label: 'Stock movements' }}>
      <ScrollArea.Content>
        <List aria-label="Stock movements" variant="ruled">
          {DAYS.map((group) => (
            <ListSection
              end={`${group.moves.length} moves`}
              key={group.day}
              label={group.day}
              labelVariant="ruled"
              sticky
            >
              {group.moves.map((move) => (
                <ListItem key={move.id}>
                  <ListItemContent>
                    <ListItemBody>
                      <ListItemLabel>{move.sku}</ListItemLabel>
                    </ListItemBody>
                    <ListItemEnd>{move.quantity}</ListItemEnd>
                  </ListItemContent>
                </ListItem>
              ))}
            </ListSection>
          ))}
        </List>
      </ScrollArea.Content>
    </ScrollArea>
  );
}
