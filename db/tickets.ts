import { and, count, desc, eq, sql } from 'drizzle-orm';
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

export type TicketPage = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
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

export async function listTickets(page: number): Promise<TicketPage> {
  const db = getDb();

  const [items, totals] = await Promise.all([
    db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt), desc(tickets.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(tickets),
  ]);

  const total = Number(totals[0]?.total ?? 0);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
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
