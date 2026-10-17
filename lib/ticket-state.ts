import type { Ticket } from '@/db/schema';

export type TicketField =
  | 'title'
  | 'description'
  | 'reporterName'
  | 'reporterEmail'
  | 'department'
  | 'category'
  | 'priority';

export type TicketFormValues = Partial<Record<TicketField, string>>;

export type CreateTicketState =
  | {
      status: 'idle';
      fieldErrors: Partial<Record<TicketField, string>>;
      values: TicketFormValues;
    }
  | {
      status: 'invalid';
      fieldErrors: Partial<Record<TicketField, string>>;
      values: TicketFormValues;
    }
  | { status: 'failed'; formError: string; values: TicketFormValues }
  | { status: 'created'; createdId: string; values: TicketFormValues };

export type TicketErrorCode =
  | 'not_found'
  | 'status_changed'
  | 'invalid_move'
  | 'database_error';

export type SetTicketStatusResult =
  | { ok: true; ticket: Ticket }
  | { ok: false; code: TicketErrorCode };

export const initialCreateTicketState: CreateTicketState = {
  status: 'idle',
  fieldErrors: {},
  values: {},
};
