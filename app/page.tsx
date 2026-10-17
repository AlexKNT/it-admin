import {
  departmentKindEnum,
  ticketCategoryEnum,
  ticketPriorityEnum,
} from '@/db/schema';
import { reportMessages } from '@/lib/messages';
import { ReportForm } from './report-form';

export default function ReportPage() {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {reportMessages.title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {reportMessages.intro}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <ReportForm
            departments={departmentKindEnum.enumValues}
            categories={ticketCategoryEnum.enumValues}
            priorities={ticketPriorityEnum.enumValues}
          />

          <aside className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">
              {reportMessages.asideTitle}
            </h2>
            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              {reportMessages.asideSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
