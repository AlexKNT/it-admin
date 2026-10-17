import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const departmentKindEnum = pgEnum('department_kind', [
  'IT',
  'Sales',
  'Customer',
  'Management',
]);

export const ticketCategoryEnum = pgEnum('ticket_category', [
  'Hardware',
  'Software',
  'Account',
  'Network',
  'Other',
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'Low',
  'Normal',
  'High',
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'Open',
  'In progress',
  'Resolved',
]);

export type DepartmentKind = (typeof departmentKindEnum.enumValues)[number];
export type TicketCategory = (typeof ticketCategoryEnum.enumValues)[number];
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    reporterName: text('reporter_name').notNull(),
    reporterEmail: text('reporter_email').notNull(),
    department: departmentKindEnum('department').notNull(),
    category: ticketCategoryEnum('category').notNull(),
    priority: ticketPriorityEnum('priority').notNull(),
    status: ticketStatusEnum('status').notNull().default('Open'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    index('tickets_created_at_idx').on(table.createdAt),
    check(
      'tickets_title_length',
      sql`char_length(${table.title}) between 3 and 120`,
    ),
    check(
      'tickets_description_length',
      sql`char_length(${table.description}) between 10 and 2000`,
    ),
    check(
      'tickets_reporter_name_length',
      sql`char_length(${table.reporterName}) between 2 and 80`,
    ),
    check(
      'tickets_resolved_at_matches_status',
      sql`(${table.status} = 'Resolved' and ${table.resolvedAt} is not null) or (${table.status} <> 'Resolved' and ${table.resolvedAt} is null)`,
    ),
  ],
);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
