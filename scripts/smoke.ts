import { eq } from 'drizzle-orm';
import { closeDb, getDb } from '../db';
import { tickets } from '../db/schema';
import { createTicket, getTicket } from '../db/tickets';

const SAMPLE = {
  title: 'Smoke test ticket',
  description: 'Written by scripts/smoke.ts and read back in a second process.',
  reporterName: 'Smoke Tester',
  reporterEmail: 'smoke.tester@example.edu',
  department: 'IT',
  category: 'Other',
  priority: 'Low',
} as const;

async function write() {
  const ticket = await createTicket(SAMPLE);

  console.log(
    JSON.stringify(
      {
        step: 'write',
        id: ticket.id,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
      },
      null,
      2,
    ),
  );
  console.log(
    `\nNow read it back in a fresh process:\n  tsx --env-file=.env.local scripts/smoke.ts --read ${ticket.id}`,
  );
}

async function read(id: string) {
  const ticket = await getTicket(id);

  if (!ticket) {
    console.error('Read failed: getTicket returned null for that id.');
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        step: 'read',
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      null,
      2,
    ),
  );

  // The read process also clears its own row, so the table is empty again for
  // `pnpm db:seed`.
  await getDb().delete(tickets).where(eq(tickets.id, ticket.id));
  console.log('Read back in a separate process. Removed the smoke ticket.');
}

async function main() {
  const [mode, id] = process.argv.slice(2);

  if (mode === '--read' && id) {
    await read(id);
    return;
  }

  await write();
}

main()
  .catch((error: unknown) => {
    // The error class name only: a raw database error can echo a row value.
    console.error(
      `Smoke check failed (${
        error instanceof Error ? error.name : 'unknown error'
      }).`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
