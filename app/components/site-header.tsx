import Link from 'next/link';
import { siteMessages } from '@/lib/messages';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            IT
          </span>
          {siteMessages.name}
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {siteMessages.reportLink}
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {siteMessages.adminLink}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
