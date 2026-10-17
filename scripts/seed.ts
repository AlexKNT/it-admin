import { count } from 'drizzle-orm';
import { closeDb, getDb } from '../db';
import { tickets } from '../db/schema';
import type { NewTicket } from '../db/schema';

type SeedTicket = Omit<NewTicket, 'createdAt' | 'updatedAt' | 'resolvedAt'>;

const blurbs = [
  {
    title: 'Laptop will not boot after update',
    description:
      'The machine shows a spinning icon for ten minutes and then restarts. It worked before the update on Friday.',
    reporterName: 'Marta Kovacs',
    reporterEmail: 'marta.kovacs@example.edu',
    department: 'IT',
    category: 'Hardware',
    priority: 'High',
  },
  {
    title: 'Outlook calendar not syncing',
    description:
      'Meetings added on my phone do not appear on the desktop client. The web version shows them normally.',
    reporterName: 'Tomas Nowak',
    reporterEmail: 'tomas.nowak@example.edu',
    department: 'Sales',
    category: 'Software',
    priority: 'Normal',
  },
  {
    title: 'Password reset link expired',
    description:
      'The link in the reset email says it has expired, even when I open it straight away.',
    reporterName: 'Aisha Rahman',
    reporterEmail: 'aisha.rahman@example.edu',
    department: 'Customer',
    category: 'Account',
    priority: 'High',
  },
  {
    title: 'Meeting room wifi drops every few minutes',
    description:
      'The connection in room 2B drops for about thirty seconds at a time, several times an hour.',
    reporterName: 'Peter Lindqvist',
    reporterEmail: 'peter.lindqvist@example.edu',
    department: 'Management',
    category: 'Network',
    priority: 'Normal',
  },
  {
    title: 'Shared drive permissions missing',
    description:
      'I lost access to the planning folder after the team change. My colleague still sees it.',
    reporterName: 'Nina Petrova',
    reporterEmail: 'nina.petrova@example.edu',
    department: 'Sales',
    category: 'Account',
    priority: 'Normal',
  },
  {
    title: 'Printer on the second floor jams',
    description:
      'Every third page jams in the tray. It started after the paper was replaced on Monday.',
    reporterName: 'Jonas Weber',
    reporterEmail: 'jonas.weber@example.edu',
    department: 'IT',
    category: 'Hardware',
    priority: 'Low',
  },
  {
    title: 'Spreadsheet formula returns wrong total',
    description:
      'The sum column shows a value that is about ten percent off when a filter is applied.',
    reporterName: 'Elena Rossi',
    reporterEmail: 'elena.rossi@example.edu',
    department: 'Customer',
    category: 'Software',
    priority: 'Normal',
  },
  {
    title: 'New starter has no email account',
    description:
      'The new colleague starts on Monday and the account was not created yet. Name is in the shared sheet.',
    reporterName: 'Ravi Menon',
    reporterEmail: 'ravi.menon@example.edu',
    department: 'Management',
    category: 'Account',
    priority: 'High',
  },
  {
    title: 'VPN disconnects when laptop sleeps',
    description:
      'After waking the machine the VPN client claims to be connected but nothing loads until I reconnect.',
    reporterName: 'Sofia Almeida',
    reporterEmail: 'sofia.almeida@example.edu',
    department: 'IT',
    category: 'Network',
    priority: 'Normal',
  },
  {
    title: 'Monitor flickers at the top edge',
    description:
      'The top strip of the display flickers on and off. A different cable made no difference.',
    reporterName: 'Daniel Fischer',
    reporterEmail: 'daniel.fischer@example.edu',
    department: 'Customer',
    category: 'Hardware',
    priority: 'Low',
  },
  {
    title: 'Leave request form will not submit',
    description:
      'The submit button does nothing after the second step of the form. It worked last month.',
    reporterName: 'Hannah Berg',
    reporterEmail: 'hannah.berg@example.edu',
    department: 'Management',
    category: 'Software',
    priority: 'High',
  },
  {
    title: 'Access to the reporting dashboard',
    description:
      'I need read access to the weekly dashboard for the new role, starting from next week.',
    reporterName: 'Lucas Silva',
    reporterEmail: 'lucas.silva@example.edu',
    department: 'Sales',
    category: 'Account',
    priority: 'Normal',
  },
  {
    title: 'Video calls break up on the office network',
    description:
      'Audio drops out for a second or two every minute. Home network is fine, so it looks local.',
    reporterName: 'Grace Okafor',
    reporterEmail: 'grace.okafor@example.edu',
    department: 'IT',
    category: 'Network',
    priority: 'High',
  },
  {
    title: 'Laptop battery drains in an hour',
    description:
      'The battery used to last a whole day and now it empties in about an hour with light use.',
    reporterName: 'Emil Hansen',
    reporterEmail: 'emil.hansen@example.edu',
    department: 'Sales',
    category: 'Hardware',
    priority: 'Normal',
  },
  {
    title: 'Documents print in the wrong language',
    description:
      'Words with accents come out garbled on the shared printer, but the screen shows them correctly.',
    reporterName: 'Yara Haddad',
    reporterEmail: 'yara.haddad@example.edu',
    department: 'Customer',
    category: 'Other',
    priority: 'Low',
  },
  {
    title: 'Two factor code never arrives',
    description:
      'The code does not reach my phone, so I cannot sign in to the admin console at all.',
    reporterName: 'Oscar Lindgren',
    reporterEmail: 'oscar.lindgren@example.edu',
    department: 'Management',
    category: 'Account',
    priority: 'High',
  },
  {
    title: 'Backup job reports a warning',
    description:
      'The nightly backup finishes with one warning about a skipped folder. Everything else is green.',
    reporterName: 'Priya Nair',
    reporterEmail: 'priya.nair@example.edu',
    department: 'IT',
    category: 'Software',
    priority: 'Normal',
  },
  {
    title: 'Headset microphone is very quiet',
    description:
      'Callers say my voice is barely audible. The same headset is loud on my home machine.',
    reporterName: 'Felix Braun',
    reporterEmail: 'felix.braun@example.edu',
    department: 'Sales',
    category: 'Hardware',
    priority: 'Low',
  },
  {
    title: 'Shared mailbox missing after rename',
    description:
      'The team mailbox disappeared from my folder list after the department name changed.',
    reporterName: 'Clara Moreau',
    reporterEmail: 'clara.moreau@example.edu',
    department: 'Customer',
    category: 'Account',
    priority: 'Normal',
  },
  {
    title: 'Slow file share from the annex',
    description:
      'Opening the shared drive from the annex building takes close to a minute each time.',
    reporterName: 'Ivan Petrov',
    reporterEmail: 'ivan.petrov@example.edu',
    department: 'IT',
    category: 'Network',
    priority: 'Normal',
  },
  {
    title: 'Time tracking widget shows yesterday',
    description:
      'The widget on the intranet always shows my hours from the day before, never the current day.',
    reporterName: 'Mei Tanaka',
    reporterEmail: 'mei.tanaka@example.edu',
    department: 'Management',
    category: 'Software',
    priority: 'Low',
  },
  {
    title: 'Keyboard keys stick after cleaning',
    description:
      'Several keys on the external keyboard stick after the desk was cleaned last week.',
    reporterName: 'Adam Kowalski',
    reporterEmail: 'adam.kowalski@example.edu',
    department: 'Customer',
    category: 'Hardware',
    priority: 'Low',
  },
  {
    title: 'Guest network password not accepted',
    description:
      'Visitors get a wrong password message with the code from the reception desk.',
    reporterName: 'Laura Sanchez',
    reporterEmail: 'laura.sanchez@example.edu',
    department: 'Sales',
    category: 'Network',
    priority: 'Normal',
  },
  {
    title: 'Archived tickets still visible in the list',
    description:
      'Closed items from last term are still listed for everyone. They should be hidden by now.',
    reporterName: 'Victor Dubois',
    reporterEmail: 'victor.dubois@example.edu',
    department: 'IT',
    category: 'Software',
    priority: 'Normal',
  },
  {
    title: 'Request for a second monitor',
    description:
      'I work with two documents side by side and would like a second screen for the desk.',
    reporterName: 'Sara Nilsson',
    reporterEmail: 'sara.nilsson@example.edu',
    department: 'Management',
    category: 'Other',
    priority: 'Low',
  },
] satisfies SeedTicket[];

function buildSeedTicket(ticket: SeedTicket, index: number): NewTicket {
  const createdAt = new Date(
    Date.UTC(2026, 8, 1 + index, 8 + (index % 8), (index * 7) % 60),
  );

  if (index % 7 === 3) {
    const resolvedAt = new Date(createdAt.getTime() + 60 * 60 * 1000);

    return {
      ...ticket,
      status: 'Resolved',
      createdAt,
      updatedAt: resolvedAt,
      resolvedAt,
    };
  }

  if (index % 5 === 2) {
    const updatedAt = new Date(createdAt.getTime() + 30 * 60 * 1000);

    return { ...ticket, status: 'In progress', createdAt, updatedAt };
  }

  return { ...ticket, status: 'Open', createdAt, updatedAt: createdAt };
}

async function main() {
  const db = getDb();
  const [totals] = await db.select({ total: count() }).from(tickets);
  const total = Number(totals?.total ?? 0);

  if (total > 0) {
    console.error(
      `Seed refused: the tickets table already holds ${total} rows. Empty it first.`,
    );
    process.exitCode = 1;
    return;
  }

  const rows = blurbs.map(buildSeedTicket);

  await db.insert(tickets).values(rows);

  console.log(`Seeded ${rows.length} demo tickets.`);
}

main()
  .catch((error: unknown) => {
    // Only the error class name is printed: a raw database error can echo a row
    // value, and the reporter email must never reach a log.
    console.error(
      `Seed failed while writing demo tickets (${
        error instanceof Error ? error.name : 'unknown error'
      }).`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
