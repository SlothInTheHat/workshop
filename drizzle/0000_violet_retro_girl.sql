CREATE TABLE "agenda_items" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breakout_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"use_case_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"use_case_id" text,
	"team_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"value" text NOT NULL,
	"viability" text NOT NULL,
	"visibility" text NOT NULL,
	"added_by" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"similarity_score" integer,
	"similar_to" text,
	"rationale" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"team_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"value" text NOT NULL,
	"viability" text NOT NULL,
	"visibility" text NOT NULL,
	"added_by" text NOT NULL,
	"participant_id" text NOT NULL,
	"position_x" real DEFAULT 0 NOT NULL,
	"position_y" real DEFAULT 0 NOT NULL,
	"cluster_id" integer,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"upvoted_by" text[] DEFAULT '{}' NOT NULL,
	"cross_team_overlap" text,
	"insight_id" text NOT NULL,
	"collaborators" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Participant' NOT NULL,
	"initials" text NOT NULL,
	"color" text DEFAULT 'bg-gray-400' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workshop_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"workshop_id" text NOT NULL,
	"user_id" text NOT NULL,
	"presence" text DEFAULT 'remote' NOT NULL,
	"team_id" text,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"client" text NOT NULL,
	"status" text DEFAULT 'setup' NOT NULL,
	"join_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workshops_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakout_teams" ADD CONSTRAINT "breakout_teams_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_use_case_id_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_participant_id_workshop_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."workshop_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_team_id_breakout_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."breakout_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_team_id_breakout_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."breakout_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_participant_id_workshop_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."workshop_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_participants" ADD CONSTRAINT "workshop_participants_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_participants" ADD CONSTRAINT "workshop_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_participants" ADD CONSTRAINT "workshop_participants_team_id_breakout_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."breakout_teams"("id") ON DELETE set null ON UPDATE no action;