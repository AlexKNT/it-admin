import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listTickets } from '@/db/tickets';
import type { TicketCounts, TicketView } from '@/db/tickets';
import type { Ticket } from '@/db/schema';
import { formatUtcDateTime } from '@/lib/format';
import { adminMessages } from '@/lib/messages';
import { parsePageParam } from '@/lib/paging';
import {
  priorityBadgeVariants,
  shortTicketId,
  statusBadgeVariants,
  ticketExcerpt,
} from '@/lib/ticket-display';
import { adminPath, parseTicketViewParam } from '@/lib/ticket-view';
import { cn } from '@/lib/utils';
import { QueueFeedbackProvider } from './queue-feedback';
import { TicketActions } from './ticket-actions';

type TicketListProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ViewLinksProps = {
  view: TicketView;
  counts: TicketCounts;
};

type TicketRowsProps = {
  items: Ticket[];
  view: TicketView;
};

type PagingRowProps = {
  view: TicketView;
  page: number;
  pageCount: number;
  total: number;
};

export async function TicketList({ searchParams }: TicketListProps) {
  const params = await searchParams;
  const view = parseTicketViewParam(params.status);
  const requestedPage = parsePageParam(params.page);
  const { items, total, page, pageCount, counts } = await listTickets(
    requestedPage,
    view,
  );

  return (
    <QueueFeedbackProvider>
      <ViewLinks view={view} counts={counts} />

      {total === 0 ? (
        <EmptyState view={view} />
      ) : items.length === 0 ? (
        <OutOfRangeState view={view} total={total} pageCount={pageCount} />
      ) : (
        <div className="flex flex-col gap-4">
          <TicketTable items={items} view={view} />
          <TicketCardList items={items} view={view} />
          <PagingRow
            view={view}
            page={page}
            pageCount={pageCount}
            total={total}
          />
        </div>
      )}
    </QueueFeedbackProvider>
  );
}

function ViewLinks({ view, counts }: ViewLinksProps) {
  const views = [
    {
      key: 'unresolved',
      label: adminMessages.views.unresolved,
      count: counts.unresolved,
    },
    {
      key: 'resolved',
      label: adminMessages.views.resolved,
      count: counts.resolved,
    },
  ] as const;

  return (
    <nav
      aria-label={adminMessages.viewsLabel}
      className="flex w-fit items-center gap-1 rounded-xl border border-border bg-card p-1"
    >
      {views.map((item) => {
        const active = view === item.key;

        return (
          <Link
            key={item.key}
            href={adminPath(item.key, 1)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>{item.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                active ? 'bg-primary-foreground/20' : 'bg-muted',
              )}
            >
              {item.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function EmptyState({ view }: { view: TicketView }) {
  const copy =
    view === 'resolved'
      ? adminMessages.empty.resolved
      : adminMessages.empty.unresolved;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">{copy.title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{copy.body}</p>
      {view === 'unresolved' ? (
        <Button asChild>
          <Link href={adminPath('resolved', 1)}>
            {adminMessages.empty.unresolved.link}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function OutOfRangeState({
  view,
  total,
  pageCount,
}: {
  view: TicketView;
  total: number;
  pageCount: number;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">{adminMessages.outOfRangeTitle}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {adminMessages.outOfRangeBody(total, pageCount)}
      </p>
      <Button asChild variant="outline">
        <Link href={adminPath(view, 1)}>{adminMessages.outOfRangeLink}</Link>
      </Button>
    </div>
  );
}

function TicketTable({ items, view }: TicketRowsProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>{adminMessages.columns.ticket}</TableHead>
            <TableHead>{adminMessages.columns.reporter}</TableHead>
            <TableHead>{adminMessages.columns.department}</TableHead>
            <TableHead>{adminMessages.columns.category}</TableHead>
            <TableHead>{adminMessages.columns.priority}</TableHead>
            <TableHead>{adminMessages.columns.status}</TableHead>
            <TableHead>{adminMessages.columns.created}</TableHead>
            {view === 'resolved' ? (
              <TableHead>{adminMessages.columns.resolved}</TableHead>
            ) : null}
            {view === 'unresolved' ? (
              <TableHead>{adminMessages.columns.actions}</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="max-w-[22rem] whitespace-normal align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{ticket.title}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {ticketExcerpt(ticket.description)}
                  </span>
                  <span className="font-mono text-[0.7rem] text-muted-foreground">
                    {shortTicketId(ticket.id)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-col">
                  <span>{ticket.reporterName}</span>
                  <span className="text-xs break-all text-muted-foreground">
                    {ticket.reporterEmail}
                  </span>
                </div>
              </TableCell>
              <TableCell className="align-top">{ticket.department}</TableCell>
              <TableCell className="align-top">{ticket.category}</TableCell>
              <TableCell className="align-top">
                <Badge variant={priorityBadgeVariants[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell className="align-top">
                <Badge variant={statusBadgeVariants[ticket.status]}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell className="align-top text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                <time dateTime={ticket.createdAt.toISOString()}>
                  {formatUtcDateTime(ticket.createdAt)}
                </time>
              </TableCell>
              {view === 'resolved' ? (
                <TableCell className="align-top text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {ticket.resolvedAt ? (
                    <time dateTime={ticket.resolvedAt.toISOString()}>
                      {formatUtcDateTime(ticket.resolvedAt)}
                    </time>
                  ) : (
                    adminMessages.noResolvedTime
                  )}
                </TableCell>
              ) : null}
              {view === 'unresolved' ? (
                <TableCell className="align-top">
                  <TicketActions
                    id={ticket.id}
                    title={ticket.title}
                    status={ticket.status}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TicketCardList({ items, view }: TicketRowsProps) {
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {items.map((ticket) => (
        <li
          key={ticket.id}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold break-words">
                {ticket.title}
              </h2>
              <Badge variant={statusBadgeVariants[ticket.status]}>
                {ticket.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {ticketExcerpt(ticket.description)}
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="min-w-0">
                <dt className="text-muted-foreground">
                  {adminMessages.columns.reporter}
                </dt>
                <dd className="break-words">{ticket.reporterName}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">
                  {adminMessages.columns.email}
                </dt>
                <dd className="break-all">{ticket.reporterEmail}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">
                  {adminMessages.columns.department}
                </dt>
                <dd>{ticket.department}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">
                  {adminMessages.columns.category}
                </dt>
                <dd>{ticket.category}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">
                  {adminMessages.columns.priority}
                </dt>
                <dd>
                  <Badge variant={priorityBadgeVariants[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">
                  {adminMessages.columns.created}
                </dt>
                <dd className="tabular-nums">
                  <time dateTime={ticket.createdAt.toISOString()}>
                    {formatUtcDateTime(ticket.createdAt)}
                  </time>
                </dd>
              </div>
              {view === 'resolved' ? (
                <div className="min-w-0">
                  <dt className="text-muted-foreground">
                    {adminMessages.resolvedAtLabel}
                  </dt>
                  <dd className="tabular-nums">
                    {ticket.resolvedAt ? (
                      <time dateTime={ticket.resolvedAt.toISOString()}>
                        {formatUtcDateTime(ticket.resolvedAt)}
                      </time>
                    ) : (
                      adminMessages.noResolvedTime
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
            {view === 'unresolved' ? (
              <TicketActions
                id={ticket.id}
                title={ticket.title}
                status={ticket.status}
              />
            ) : null}
            <p className="font-mono text-[0.7rem] text-muted-foreground">
              {shortTicketId(ticket.id)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PagingRow({ view, page, pageCount, total }: PagingRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      {page > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={adminPath(view, page - 1)} rel="prev">
            {adminMessages.previous}
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {adminMessages.previous}
        </Button>
      )}

      <span className="text-sm text-muted-foreground tabular-nums">
        {adminMessages.pagePosition(page, pageCount, total)}
      </span>

      {page < pageCount ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={adminPath(view, page + 1)} rel="next">
            {adminMessages.next}
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {adminMessages.next}
        </Button>
      )}
    </div>
  );
}

export function TicketListFallback() {
  const rows = [0, 1, 2, 3];

  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">{adminMessages.loading}</span>
      {rows.map((row) => (
        <div
          key={row}
          className="h-16 animate-pulse rounded-xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}
