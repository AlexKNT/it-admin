import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import type { TicketPriority, TicketStatus } from '@/db/schema';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export const priorityBadgeVariants: Record<TicketPriority, BadgeVariant> = {
  Low: 'outline',
  Normal: 'secondary',
  High: 'destructive',
};

export const statusBadgeVariants: Record<TicketStatus, BadgeVariant> = {
  Open: 'default',
  'In progress': 'secondary',
  Resolved: 'outline',
};

const EXCERPT_LIMIT = 120;

// A one line summary cut at a word boundary, so a long report does not turn a
// row into a paragraph.
export function ticketExcerpt(text: string, limit = EXCERPT_LIMIT) {
  const normalised = text.replace(/\s+/g, ' ').trim();

  if (normalised.length <= limit) {
    return normalised;
  }

  const cut = normalised.slice(0, limit);
  const boundary = cut.lastIndexOf(' ');
  const kept = boundary > limit * 0.6 ? cut.slice(0, boundary) : cut;

  return `${kept.trimEnd()}\u2026`;
}

export function shortTicketId(id: string) {
  return id.slice(0, 8);
}
