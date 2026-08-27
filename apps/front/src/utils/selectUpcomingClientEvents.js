export function selectUpcomingClientEvents(
  events,
  now = new Date()
) {
  return events
    .filter(
      (event) =>
        event.status === "ACCEPTED" &&
        new Date(event.start_at) >= now
    )
    .sort(
      (a, b) =>
        new Date(a.start_at) -
        new Date(b.start_at)
    )
    .slice(0, 3);
}
