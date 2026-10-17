import type { TicketStatus } from '@/db/schema';

const allowedMoves: Record<TicketStatus, readonly TicketStatus[]> = {
  Open: ['In progress', 'Resolved'],
  'In progress': ['Resolved'],
  Resolved: [],
};

export function isAllowedMove(current: TicketStatus, next: TicketStatus) {
  return allowedMoves[current].includes(next);
}
