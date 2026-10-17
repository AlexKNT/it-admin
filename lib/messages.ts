import type { TicketStatus } from '@/db/schema';
import type { TicketErrorCode, TicketField } from '@/lib/ticket-state';

// Fixed copy, one line per field and per error code. Messages name the field
// only, so a reporter email can never reach a rendered error.
export const fieldErrorMessages: Record<TicketField, string> = {
  title: 'Title must be between 3 and 120 characters.',
  description: 'Description must be between 10 and 2000 characters.',
  reporterName: 'Reporter name must be between 2 and 80 characters.',
  reporterEmail: 'Reporter email must be a valid email address.',
  department: 'Choose one of the listed departments.',
  category: 'Choose one of the listed categories.',
  priority: 'Choose one of the listed priorities.',
};

export const ticketErrorMessages: Record<TicketErrorCode, string> = {
  not_found: 'That ticket no longer exists.',
  status_changed: 'Someone else changed this ticket. Reload and try again.',
  invalid_move: 'A ticket can only move forward through its states.',
  database_error: 'The database could not be reached. Try again.',
};

export const siteMessages = {
  name: 'IT helpdesk',
  reportLink: 'Report a ticket',
  adminLink: 'Admin',
};

export const reportMessages = {
  title: 'Report a ticket',
  intro:
    'Describe the problem once and it joins the queue. The admin reads every ticket, newest first.',
  submit: 'Send ticket',
  submitPending: 'Sending ticket',
  successTitle: 'Ticket saved',
  successBody: (id: string) => `Ticket ${id} is saved and is now first in the queue.`,
  successLink: 'Open the ticket queue',
  failedTitle: 'The ticket was not sent',
  submitHint: 'Nothing is sent until you press the button.',
  asideTitle: 'What happens next',
  asideSteps: [
    'Your ticket joins the queue with the status Open.',
    'The admin reads it in arrival order, newest first.',
    'A reply goes to the email address you give here.',
  ],
  summaryTitle: 'Check the highlighted fields',
  summaryBody: (count: number) =>
    count === 1
      ? '1 field needs attention before this ticket can be sent.'
      : `${count} fields need attention before this ticket can be sent.`,
  labels: {
    title: 'Title',
    description: 'Description',
    reporterName: 'Your name',
    reporterEmail: 'Your email',
    department: 'Department',
    category: 'Category',
    priority: 'Priority',
  },
  placeholders: {
    title: 'Short summary of the problem',
    description: 'What happened, what you expected, and what you already tried',
    reporterName: 'First and last name',
    reporterEmail: 'name@example.edu',
    department: 'Choose one',
    category: 'Choose one',
    priority: 'Choose one',
  },
  hints: {
    title: 'Up to 120 characters.',
    description: 'Up to 2000 characters.',
  },
};

export const adminMessages = {
  title: 'Ticket queue',
  intro:
    'Unresolved holds the work that is still waiting, newest first. Resolved keeps what is closed, with the time it closed.',
  loading: 'Loading tickets',
  viewsLabel: 'Ticket views',
  views: {
    unresolved: 'Unresolved',
    resolved: 'Resolved',
  },
  empty: {
    unresolved: {
      title: 'Nothing is waiting',
      body: 'Every ticket in the queue is resolved.',
      link: 'Open the resolved view',
    },
    resolved: {
      title: 'Nothing has been resolved yet',
      body: 'A ticket lands here once it is resolved from the unresolved view.',
    },
  },
  outOfRangeTitle: 'This page is past the end of this view',
  outOfRangeBody: (total: number, pageCount: number) =>
    `This view holds ${total} tickets across ${pageCount} ${
      pageCount === 1 ? 'page' : 'pages'
    }.`,
  outOfRangeLink: 'Back to page 1',
  previous: 'Previous',
  next: 'Next',
  pagePosition: (page: number, pageCount: number, total: number) =>
    `Page ${page} of ${pageCount}, ${total} tickets`,
  resolvedAtLabel: 'Resolved at',
  noResolvedTime: 'No resolved time',
  columns: {
    ticket: 'Ticket',
    reporter: 'Reporter',
    email: 'Email',
    department: 'Department',
    category: 'Category',
    priority: 'Priority',
    status: 'Status',
    created: 'Created',
    resolved: 'Resolved',
    actions: 'Actions',
  },
  actions: {
    startWork: 'Start work',
    starting: 'Starting',
    resolve: 'Resolve',
    confirmResolve: 'Confirm resolve',
    resolving: 'Resolving',
    cancel: 'Cancel',
    startWorkOn: (title: string) => `Start work on "${title}"`,
    startingOn: (title: string) => `Starting work on "${title}"`,
    resolveOn: (title: string) => `Resolve "${title}"`,
    confirmResolveOn: (title: string) => `Confirm resolve of "${title}"`,
    resolvingOn: (title: string) => `Resolving "${title}"`,
    cancelOn: (title: string) => `Cancel resolving "${title}"`,
  },
  live: {
    movedTo: (shortId: string, status: TicketStatus) =>
      `Ticket ${shortId} is now ${status}.`,
    resolvedToView: (shortId: string, status: TicketStatus) =>
      `Ticket ${shortId} is now ${status} and moved to the Resolved view.`,
  },
};
