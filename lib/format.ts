const utcDateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

// One formatter for every rendered time, so the server string and the browser
// string cannot drift apart.
export function formatUtcDateTime(value: Date) {
  return `${utcDateTime.format(value)} UTC`;
}
