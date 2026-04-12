CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"use_case_id" text NOT NULL,
	"team_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"value" text NOT NULL,
	"viability" text NOT NULL,
	"visibility" text NOT NULL,
	"added_by" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"presence" text DEFAULT 'remote' NOT NULL,
	"team_id" text,
	"initials" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"use_case_id" text NOT NULL,
	"promoted_by" text NOT NULL,
	"target_type" text NOT NULL,
	"promoted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"use_case_id" text NOT NULL,
	"scored_by" text NOT NULL,
	"impact" integer NOT NULL,
	"feasibility" integer NOT NULL,
	"alignment" integer NOT NULL,
	"executive_weight" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"name" text NOT NULL,
	"member_ids" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"team_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"value" text NOT NULL,
	"viability" text NOT NULL,
	"visibility" text NOT NULL,
	"added_by" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"upvoted_by" jsonb DEFAULT '[]' NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"collaborators" jsonb DEFAULT '[]' NOT NULL,
	"cross_team_overlap" text,
	"position" jsonb DEFAULT '{"x":0,"y":0}' NOT NULL,
	"cluster_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshop_summaries" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"content" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"client" text NOT NULL,
	"status" text DEFAULT 'setup' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"agenda" jsonb
);
--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_use_case_id_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_use_case_id_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_use_case_id_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_summaries" ADD CONSTRAINT "workshop_summaries_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;