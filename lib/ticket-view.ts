import type { TicketView } from '@/db/tickets';

export type TicketViewParam = Exclude<TicketView, 'all'>;

// Only the exact string `resolved` opens the closed view, so a missing,
// repeated or unknown value always lands on the working view.
export function parseTicketViewParam(
  value: string | string[] | undefined,
): TicketViewParam {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw === 'resolved' ? 'resolved' : 'unresolved';
}

// Every link to the list goes through here, so a view keeps its own parameter
// and paging can never leak a page number into the other view.
export function adminPath(view: TicketView, page: number) {
  const params = new URLSearchParams();

  if (view === 'resolved') {
    params.set('status', 'resolved');
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query ? `/admin?${query}` : '/admin';
}
