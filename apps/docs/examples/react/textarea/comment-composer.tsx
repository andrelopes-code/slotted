import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';
import { Text } from '@slotted/react/typography';

interface Comment {
  id: number;
  author: string;
  time: string;
  body: string;
}

const THREAD: Comment[] = [
  {
    id: 1,
    author: 'Maria Anders',
    time: '09:12',
    body: 'The customer called: the pallet has to arrive before the store opens at 8:00.',
  },
  {
    id: 2,
    author: 'Thomas Hardy',
    time: '10:47',
    body: 'Booked with the early carrier. Tracking follows once the truck is loaded.',
  },
];

export default function TextareaCommentComposer() {
  const [comments, setComments] = useState(THREAD);
  const [draft, setDraft] = useState('');

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (body === '') return;
    setComments((current) => [
      ...current,
      { id: current.length + 1, author: 'You', time: 'Just now', body },
    ]);
    setDraft('');
  };

  return (
    <Stack gap={6}>
      <Stack gap={4}>
        {comments.map((comment) => (
          <Stack key={comment.id} gap={1}>
            <Inline gap={2} align="baseline">
              <Text size="sm" weight="semibold">
                {comment.author}
              </Text>
              <Text size="sm" tone="muted">
                {comment.time}
              </Text>
            </Inline>
            <Text size="sm">{comment.body}</Text>
          </Stack>
        ))}
      </Stack>
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Field>
            <FieldLabel>Comment on order 10248</FieldLabel>
            <Textarea
              autoSize
              rows={2}
              maxRows={8}
              placeholder="Write an update for the team"
              value={draft}
              onValueChange={setDraft}
            />
          </Field>
          <Inline justify="end">
            <Button type="submit">Post comment</Button>
          </Inline>
        </Stack>
      </form>
    </Stack>
  );
}
