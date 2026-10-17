import { and, count, desc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { tickets } from '@/db/schema';
import type { NewTicket, Ticket, TicketStatus } from '@/db/schema';
import { isAllowedMove } from '@/lib/ticket-status';
import type { SetTicketStatusResult } from '@/lib/ticket-state';

export const PAGE_SIZE = 20;

// The generated columns stay with the database so a caller cannot set them.
export type CreateTicketInput = Omit<
  NewTicket,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt'
>;

export type TicketView = 'all' | 'unresolved' | 'resolved';

export type TicketCounts = {
  unresolved: number;
  resolved: number;
};

export type TicketPage = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: TicketCounts;
};

export async function createTicket(input: CreateTicketInput) {
  const [ticket] = await getDb().insert(tickets).values(input).returning();

  return ticket;
}

export async function getTicket(id: string) {
  if (!z.uuid().safeParse(id).success) {
    return null;
  }

  const [ticket] = await getDb()
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  return ticket ?? null;
}

export async function listTickets(
  page: number,
  view: TicketView = 'all',
): Promise<TicketPage> {
  const db = getDb();

  const where =
    view === 'all'
      ? undefined
      : view === 'resolved'
        ? eq(tickets.status, 'Resolved')
        : ne(tickets.status, 'Resolved');

  // One grouped count feeds both view links, so the two counts can never
  // disagree with each other or with the rows on screen.
  const [items, statusTotals] = await Promise.all([
    db
      .select()
      .from(tickets)
      .where(where)
      .orderBy(desc(tickets.createdAt), desc(tickets.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ status: tickets.status, total: count() })
      .from(tickets)
      .groupBy(tickets.status),
  ]);

  const counts: TicketCounts = { unresolved: 0, resolved: 0 };

  for (const row of statusTotals) {
    const total = Number(row.total);

    if (row.status === 'Resolved') {
      counts.resolved += total;
    } else {
      counts.unresolved += total;
    }
  }

  const total =
    view === 'resolved'
      ? counts.resolved
      : view === 'unresolved'
        ? counts.unresolved
        : counts.unresolved + counts.resolved;

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    counts,
  };
}

export async function setTicketStatus(
  id: string,
  next: TicketStatus,
  expected: TicketStatus,
): Promise<SetTicketStatusResult> {
  if (!isAllowedMove(expected, next)) {
    return { ok: false, code: 'invalid_move' };
  }

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, code: 'not_found' };
  }

  const db = getDb();

  try {
    const [updated] = await db
      .update(tickets)
      .set({
        status: next,
        resolvedAt: next === 'Resolved' ? sql`now()` : undefined,
        updatedAt: sql`now()`,
      })
      .where(and(eq(tickets.id, id), eq(tickets.status, expected)))
      .returning();

    if (updated) {
      return { ok: true, ticket: updated };
    }

    const [existing] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    return { ok: false, code: existing ? 'status_changed' : 'not_found' };
  } catch {
    return { ok: false, code: 'database_error' };
  }
}
