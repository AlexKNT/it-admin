import { Suspense } from 'react';
import { adminMessages } from '@/lib/messages';
import { TicketList, TicketListFallback } from './ticket-list';

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AdminPage({ searchParams }: AdminPageProps) {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {adminMessages.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {adminMessages.intro}
          </p>
        </div>

        <Suspense fallback={<TicketListFallback />}>
          <TicketList searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
