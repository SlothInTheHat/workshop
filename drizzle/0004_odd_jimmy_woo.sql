CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"type" text DEFAULT 'document' NOT NULL,
	"title" text NOT NULL,
	"storage_url" text NOT NULL,
	"visibility" text DEFAULT 'all' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributor_inputs" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"goals_and_objectives" text,
	"pain_points" text,
	"current_workflow" text,
	"constraints" text,
	"success_criteria" text,
	"completion_pct" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pre_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'contributor' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_workshops" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"focus_area" text,
	"objective" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"data_sensitivity" text DEFAULT 'internal' NOT NULL,
	"lead_facilitator_name" text,
	"ai_context" text,
	"kickoff_summary" text,
	"facilitator_code" text,
	"contributor_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
