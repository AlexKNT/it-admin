'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { KeyboardEvent } from 'react';
import { setTicketStatusAction } from '@/app/actions/tickets';
import { Button } from '@/components/ui/button';
import type { TicketStatus } from '@/db/schema';
import { adminMessages, ticketErrorMessages } from '@/lib/messages';
import { shortTicketId } from '@/lib/ticket-display';
import { useQueueFeedback } from './queue-feedback';

const CONFIRM_TIMEOUT_MS = 6000;

type TicketActionsProps = {
  id: string;
  title: string;
  status: TicketStatus;
};

export function TicketActions({ id, title, status }: TicketActionsProps) {
  const router = useRouter();
  const { announce, openConfirmId, setOpenConfirmId } = useQueueFeedback();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const resolveRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  // The provider owns the open confirm, so opening one row closes any other.
  const confirmOpen = openConfirmId === id;

  useEffect(() => {
    if (confirmOpen) {
      confirmRef.current?.focus();
      return;
    }

    if (restoreFocus.current) {
      restoreFocus.current = false;
      resolveRef.current?.focus();
    }
  }, [confirmOpen]);

  // The timer depends on the open flag alone, so a re-render of the row never
  // restarts the six seconds.
  useEffect(() => {
    if (!confirmOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      restoreFocus.current = true;
      setOpenConfirmId(null);
    }, CONFIRM_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [confirmOpen, setOpenConfirmId]);

  function openConfirm() {
    setError(null);
    setOpenConfirmId(id);
  }

  function cancelConfirm() {
    restoreFocus.current = true;
    setOpenConfirmId(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && confirmOpen) {
      event.stopPropagation();
      cancelConfirm();
    }
  }

  function send(next: TicketStatus, expected: TicketStatus) {
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await setTicketStatusAction({ id, next, expected });

        if (result.ok) {
          const short = shortTicketId(result.ticket.id);

          if (result.ticket.status === 'Resolved') {
            setOpenConfirmId(null);
            announce(adminMessages.live.resolvedToView(short, result.ticket.status), {
              focus: true,
            });
          } else {
            announce(adminMessages.live.movedTo(short, result.ticket.status));
          }

          return;
        }

        announce(ticketErrorMessages[result.code]);

        if (result.code === 'database_error') {
          setError(ticketErrorMessages.database_error);
          return;
        }

        router.refresh();
      } catch {
        const copy = ticketErrorMessages.database_error;
        announce(copy);
        setError(copy);
      } finally {
        setPending(false);
      }
    });
  }

  if (status === 'Resolved') {
    return null;
  }

  return (
    <div className="flex flex-col gap-1" onKeyDown={handleKeyDown}>
      <div className="flex flex-wrap items-center gap-2">
        {status === 'Open' ? (
          <Button
            size="sm"
            disabled={pending}
            aria-label={
              pending
                ? adminMessages.actions.startingOn(title)
                : adminMessages.actions.startWorkOn(title)
            }
            onClick={() => send('In progress', status)}
          >
            {pending
              ? adminMessages.actions.starting
              : adminMessages.actions.startWork}
          </Button>
        ) : confirmOpen ? (
          <>
            <Button
              ref={confirmRef}
              size="sm"
              variant="destructive"
              disabled={pending}
              aria-label={
                pending
                  ? adminMessages.actions.resolvingOn(title)
                  : adminMessages.actions.confirmResolveOn(title)
              }
              onClick={() => send('Resolved', status)}
            >
              {pending
                ? adminMessages.actions.resolving
                : adminMessages.actions.confirmResolve}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              aria-label={adminMessages.actions.cancelOn(title)}
              onClick={cancelConfirm}
            >
              {adminMessages.actions.cancel}
            </Button>
          </>
        ) : (
          <Button
            ref={resolveRef}
            size="sm"
            variant="outline"
            disabled={pending}
            aria-label={
              pending
                ? adminMessages.actions.resolvingOn(title)
                : adminMessages.actions.resolveOn(title)
            }
            onClick={openConfirm}
          >
            {pending
              ? adminMessages.actions.resolving
              : adminMessages.actions.resolve}
          </Button>
        )}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
