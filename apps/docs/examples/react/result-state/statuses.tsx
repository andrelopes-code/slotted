import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const REGIONS = [
  {
    status: 'empty',
    title: 'No shipments yet',
    description: 'Shipments appear here once a carrier collects an order.',
  },
  {
    status: 'no-results',
    title: 'No orders match this search',
    description: 'Check the spelling or search by order number.',
  },
  {
    status: 'not-found',
    title: 'Order SO-10492 does not exist',
    description: 'It may have been merged into another order.',
  },
  {
    status: 'error',
    title: 'Orders did not load',
    description: 'The orders service did not respond. Try again in a moment.',
  },
  {
    status: 'forbidden',
    title: 'Payroll reports are restricted',
    description: 'Only members of Finance can open them. Ask an administrator for access.',
  },
  {
    status: 'offline',
    title: 'You are offline',
    description: 'Changes are kept on this device and sync when the connection returns.',
  },
  {
    status: 'success',
    title: 'Refund issued',
    description: 'The customer receives 84.20 USD within 5 business days.',
  },
] as const;

export default function ResultStateStatuses() {
  return (
    <Stack gap={6}>
      {REGIONS.map((region) => (
        <Stack gap={1} key={region.status}>
          <Text size="sm" tone="muted">
            {region.status}
          </Text>
          <ResultState align="start" reach="inline" status={region.status}>
            <ResultStateContent>
              <ResultStateTitle>{region.title}</ResultStateTitle>
              <ResultStateDescription>{region.description}</ResultStateDescription>
            </ResultStateContent>
          </ResultState>
        </Stack>
      ))}
    </Stack>
  );
}
