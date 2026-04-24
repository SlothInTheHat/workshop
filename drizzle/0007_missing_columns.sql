-- Add strategic_pillars to contributor_inputs
ALTER TABLE "contributor_inputs" ADD COLUMN IF NOT EXISTS "strategic_pillars" text;

-- Add context and pillar_tags to use_cases (missing from original migration)
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "context" text DEFAULT '';
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "pillar_tags" jsonb DEFAULT '[]';
