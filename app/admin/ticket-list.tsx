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
import { formatUtcDateTime } from '@/lib/format';
import { adminMessages } from '@/lib/messages';
import { parsePageParam } from '@/lib/paging';
import {
  priorityBadgeVariants,
  shortTicketId,
  statusBadgeVariants,
  ticketExcerpt,
} from '@/lib/ticket-display';

type TicketListProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PagingRowProps = {
  page: number;
  pageCount: number;
  total: number;
};

export async function TicketList({ searchParams }: TicketListProps) {
  const requestedPage = parsePageParam((await searchParams).page);
  const { items, total, page, pageCount } = await listTickets(requestedPage);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">{adminMessages.emptyTitle}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {adminMessages.emptyBody}
        </p>
        <Button asChild>
          <Link href="/">{adminMessages.emptyLink}</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">
          {adminMessages.outOfRangeTitle}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {adminMessages.outOfRangeBody(total, pageCount)}
        </p>
        <Button asChild variant="outline">
          <Link href="/admin">{adminMessages.outOfRangeLink}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
              </dl>
              <p className="font-mono text-[0.7rem] text-muted-foreground">
                {shortTicketId(ticket.id)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <PagingRow page={page} pageCount={pageCount} total={total} />
    </div>
  );
}

function PagingRow({ page, pageCount, total }: PagingRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      {page > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin?page=${page - 1}`} rel="prev">
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
          <Link href={`/admin?page=${page + 1}`} rel="next">
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
