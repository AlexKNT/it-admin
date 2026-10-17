'use server';

import { revalidatePath } from 'next/cache';
import { createTicket, setTicketStatus } from '@/db/tickets';
import type { TicketStatus } from '@/db/schema';
import { fieldErrorMessages, ticketErrorMessages } from '@/lib/messages';
import { ticketInputSchema, ticketStatusSchema } from '@/lib/ticket-input';
import type {
  CreateTicketState,
  SetTicketStatusResult,
  TicketField,
  TicketFormValues,
} from '@/lib/ticket-state';

const TICKET_FIELDS = [
  'title',
  'description',
  'reporterName',
  'reporterEmail',
  'department',
  'category',
  'priority',
] as const satisfies readonly TicketField[];

function isTicketField(value: unknown): value is TicketField {
  return (
    typeof value === 'string' &&
    (TICKET_FIELDS as readonly string[]).includes(value)
  );
}

function readValues(formData: FormData): TicketFormValues {
  const values: TicketFormValues = {};

  for (const field of TICKET_FIELDS) {
    const value = formData.get(field);

    if (typeof value === 'string') {
      values[field] = value;
    }
  }

  return values;
}

export async function createTicketAction(
  _previousState: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const values = readValues(formData);
  const parsed = ticketInputSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<TicketField, string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (isTicketField(field) && fieldErrors[field] === undefined) {
        fieldErrors[field] = fieldErrorMessages[field];
      }
    }

    return { status: 'invalid', fieldErrors, values };
  }

  try {
    const ticket = await createTicket(parsed.data);

    revalidatePath('/admin');

    return { status: 'created', createdId: ticket.id, values };
  } catch {
    return {
      status: 'failed',
      formError: ticketErrorMessages.database_error,
      values,
    };
  }
}

export async function setTicketStatusAction(input: {
  id: string;
  next: TicketStatus;
  expected: TicketStatus;
}): Promise<SetTicketStatusResult> {
  if (
    !ticketStatusSchema.safeParse(input.next).success ||
    !ticketStatusSchema.safeParse(input.expected).success
  ) {
    return { ok: false, code: 'invalid_move' };
  }

  const result = await setTicketStatus(input.id, input.next, input.expected);

  if (result.ok) {
    revalidatePath('/admin');
  }

  return result;
}
