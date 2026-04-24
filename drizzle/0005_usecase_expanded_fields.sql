-- Add expanded use case fields
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "problem_statement" text;
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "solution_overview" text;
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "business_units" text[] NOT NULL DEFAULT '{}';
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "timeline" text;
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "costs" text;
ALTER TABLE "use_cases" ADD COLUMN IF NOT EXISTS "legal_compliance" text;
