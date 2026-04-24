-- Add strategic_pillars and teams columns to pre_workshops
ALTER TABLE "pre_workshops" ADD COLUMN IF NOT EXISTS "strategic_pillars" text[];
ALTER TABLE "pre_workshops" ADD COLUMN IF NOT EXISTS "teams" jsonb DEFAULT '[]';

-- Add strategic_pillars column to contributor_inputs
ALTER TABLE "contributor_inputs" ADD COLUMN IF NOT EXISTS "strategic_pillars" text;
