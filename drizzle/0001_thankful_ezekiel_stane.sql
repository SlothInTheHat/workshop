ALTER TABLE "workshop_summaries" ALTER COLUMN "content" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "objectives" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "strategic_pillars" jsonb DEFAULT '[]';