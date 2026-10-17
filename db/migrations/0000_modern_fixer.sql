CREATE TYPE "public"."department_kind" AS ENUM('IT', 'Sales', 'Customer', 'Management');--> statement-breakpoint
CREATE TYPE "public"."ticket_category" AS ENUM('Hardware', 'Software', 'Account', 'Network', 'Other');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('Low', 'Normal', 'High');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('Open', 'In progress', 'Resolved');--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reporter_name" text NOT NULL,
	"reporter_email" text NOT NULL,
	"department" "department_kind" NOT NULL,
	"category" "ticket_category" NOT NULL,
	"priority" "ticket_priority" NOT NULL,
	"status" "ticket_status" DEFAULT 'Open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "tickets_title_length" CHECK (char_length("tickets"."title") between 3 and 120),
	CONSTRAINT "tickets_description_length" CHECK (char_length("tickets"."description") between 10 and 2000),
	CONSTRAINT "tickets_reporter_name_length" CHECK (char_length("tickets"."reporter_name") between 2 and 80),
	CONSTRAINT "tickets_resolved_at_matches_status" CHECK (("tickets"."status" = 'Resolved' and "tickets"."resolved_at" is not null) or ("tickets"."status" <> 'Resolved' and "tickets"."resolved_at" is null))
);
--> statement-breakpoint
CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");