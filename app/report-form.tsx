'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { createTicketAction } from '@/app/actions/tickets';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  DepartmentKind,
  TicketCategory,
  TicketPriority,
} from '@/db/schema';
import { reportMessages } from '@/lib/messages';
import { initialCreateTicketState } from '@/lib/ticket-state';
import type { TicketField } from '@/lib/ticket-state';

type ReportFormProps = {
  departments: readonly DepartmentKind[];
  categories: readonly TicketCategory[];
  priorities: readonly TicketPriority[];
};

const alertFocusClasses =
  'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

export function ReportForm({
  departments,
  categories,
  priorities,
}: ReportFormProps) {
  const [state, formAction, isPending] = useActionState(
    createTicketAction,
    initialCreateTicketState,
  );
  const summaryRef = useRef<HTMLDivElement>(null);

  // A remount is the only reliable way to clear uncontrolled fields after a
  // save, because React keeps the first defaultValue on a mounted input.
  const formKey =
    state.status === 'created' ? state.createdId : 'report-form';
  const keptValues = state.status === 'created' ? {} : state.values;
  const fieldErrors = state.status === 'invalid' ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === 'invalid' || state.status === 'failed') {
      summaryRef.current?.focus();
    }
  }, [state]);

  const fieldError = (field: TicketField) => fieldErrors[field];

  return (
    <div className="flex flex-col gap-4">
      {state.status === 'created' ? (
        <Alert>
          <AlertTitle>{reportMessages.successTitle}</AlertTitle>
          <AlertDescription>
            <p>{reportMessages.successBody(state.createdId)}</p>
            <p>
              <Link href="/admin">{reportMessages.successLink}</Link>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {state.status === 'failed' ? (
        <Alert
          ref={summaryRef}
          tabIndex={-1}
          variant="destructive"
          className={alertFocusClasses}
        >
          <AlertTitle>{reportMessages.failedTitle}</AlertTitle>
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === 'invalid' ? (
        <Alert
          ref={summaryRef}
          tabIndex={-1}
          variant="destructive"
          className={alertFocusClasses}
        >
          <AlertTitle>{reportMessages.summaryTitle}</AlertTitle>
          <AlertDescription>
            {reportMessages.summaryBody(Object.keys(fieldErrors).length)}
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        key={formKey}
        action={formAction}
        noValidate
        className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 sm:p-6"
      >
        <FieldGroup>
          <Field data-invalid={Boolean(fieldError('title'))}>
            <FieldLabel htmlFor="ticket-title">
              {reportMessages.labels.title}
            </FieldLabel>
            <Input
              id="ticket-title"
              name="title"
              type="text"
              maxLength={120}
              autoComplete="off"
              placeholder={reportMessages.placeholders.title}
              defaultValue={keptValues.title ?? ''}
              aria-invalid={fieldError('title') ? true : undefined}
              aria-describedby={
                fieldError('title')
                  ? 'ticket-title-hint ticket-title-error'
                  : 'ticket-title-hint'
              }
            />
            <FieldDescription id="ticket-title-hint">
              {reportMessages.hints.title}
            </FieldDescription>
            <FieldError id="ticket-title-error">
              {fieldError('title')}
            </FieldError>
          </Field>

          <Field data-invalid={Boolean(fieldError('description'))}>
            <FieldLabel htmlFor="ticket-description">
              {reportMessages.labels.description}
            </FieldLabel>
            <Textarea
              id="ticket-description"
              name="description"
              rows={6}
              maxLength={2000}
              placeholder={reportMessages.placeholders.description}
              defaultValue={keptValues.description ?? ''}
              aria-invalid={fieldError('description') ? true : undefined}
              aria-describedby={
                fieldError('description')
                  ? 'ticket-description-hint ticket-description-error'
                  : 'ticket-description-hint'
              }
            />
            <FieldDescription id="ticket-description-hint">
              {reportMessages.hints.description}
            </FieldDescription>
            <FieldError id="ticket-description-error">
              {fieldError('description')}
            </FieldError>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(fieldError('reporterName'))}>
              <FieldLabel htmlFor="ticket-reporter-name">
                {reportMessages.labels.reporterName}
              </FieldLabel>
              <Input
                id="ticket-reporter-name"
                name="reporterName"
                type="text"
                autoComplete="name"
                placeholder={reportMessages.placeholders.reporterName}
                defaultValue={keptValues.reporterName ?? ''}
                aria-invalid={fieldError('reporterName') ? true : undefined}
                aria-describedby={
                  fieldError('reporterName')
                    ? 'ticket-reporter-name-error'
                    : undefined
                }
              />
              <FieldError id="ticket-reporter-name-error">
                {fieldError('reporterName')}
              </FieldError>
            </Field>

            <Field data-invalid={Boolean(fieldError('reporterEmail'))}>
              <FieldLabel htmlFor="ticket-reporter-email">
                {reportMessages.labels.reporterEmail}
              </FieldLabel>
              <Input
                id="ticket-reporter-email"
                name="reporterEmail"
                type="email"
                autoComplete="email"
                placeholder={reportMessages.placeholders.reporterEmail}
                defaultValue={keptValues.reporterEmail ?? ''}
                aria-invalid={fieldError('reporterEmail') ? true : undefined}
                aria-describedby={
                  fieldError('reporterEmail')
                    ? 'ticket-reporter-email-error'
                    : undefined
                }
              />
              <FieldError id="ticket-reporter-email-error">
                {fieldError('reporterEmail')}
              </FieldError>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field data-invalid={Boolean(fieldError('department'))}>
              <FieldLabel htmlFor="ticket-department">
                {reportMessages.labels.department}
              </FieldLabel>
              <Select name="department" defaultValue={keptValues.department}>
                <SelectTrigger
                  id="ticket-department"
                  className="w-full"
                  aria-invalid={fieldError('department') ? true : undefined}
                  aria-describedby={
                    fieldError('department')
                      ? 'ticket-department-error'
                      : undefined
                  }
                >
                  <SelectValue
                    placeholder={reportMessages.placeholders.department}
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError id="ticket-department-error">
                {fieldError('department')}
              </FieldError>
            </Field>

            <Field data-invalid={Boolean(fieldError('category'))}>
              <FieldLabel htmlFor="ticket-category">
                {reportMessages.labels.category}
              </FieldLabel>
              <Select name="category" defaultValue={keptValues.category}>
                <SelectTrigger
                  id="ticket-category"
                  className="w-full"
                  aria-invalid={fieldError('category') ? true : undefined}
                  aria-describedby={
                    fieldError('category')
                      ? 'ticket-category-error'
                      : undefined
                  }
                >
                  <SelectValue
                    placeholder={reportMessages.placeholders.category}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError id="ticket-category-error">
                {fieldError('category')}
              </FieldError>
            </Field>

            <Field data-invalid={Boolean(fieldError('priority'))}>
              <FieldLabel htmlFor="ticket-priority">
                {reportMessages.labels.priority}
              </FieldLabel>
              <Select
                name="priority"
                defaultValue={keptValues.priority ?? 'Normal'}
              >
                <SelectTrigger
                  id="ticket-priority"
                  className="w-full"
                  aria-invalid={fieldError('priority') ? true : undefined}
                  aria-describedby={
                    fieldError('priority')
                      ? 'ticket-priority-error'
                      : undefined
                  }
                >
                  <SelectValue
                    placeholder={reportMessages.placeholders.priority}
                  />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError id="ticket-priority-error">
                {fieldError('priority')}
              </FieldError>
            </Field>
          </div>
        </FieldGroup>

        <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {reportMessages.submitHint}
          </p>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? reportMessages.submitPending : reportMessages.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
