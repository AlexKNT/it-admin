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
