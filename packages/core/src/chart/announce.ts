/**
 * What the keyboard lands on, said once the reader stops.
 *
 * `@slotted/core/live-announcer` queues its messages and spaces them, so that
 * two different things said in one update are both heard. A reader walking a
 * series says one thing many times: twelve presses of `ArrowRight` queued
 * twelve sentences, and the reader heard January while the plot showed
 * December. Here a message replaces the one still waiting, and the last is
 * said after `delay` milliseconds without another.
 */
export function createLatestAnnouncer(
  announce: (message: string) => void,
  delay = 150,
): { say(message: string): void; cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    say(message) {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        if (message) announce(message);
      }, delay);
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
