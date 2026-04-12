import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const workshops = pgTable('workshops', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  client: text('client').notNull(),
  status: text('status').notNull().default('setup'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  agenda: jsonb('agenda'),
  objectives: jsonb('objectives').default('[]'),
  strategicPillars: jsonb('strategic_pillars').default('[]'),
  finishedVoting: jsonb('finished_voting').default('[]'),
});

export const participants = pgTable('participants', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  presence: text('presence').notNull().default('remote'),
  teamId: text('team_id'),
  initials: text('initials').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  name: text('name').notNull(),
  memberIds: jsonb('member_ids').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const useCases = pgTable('use_cases', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  teamId: text('team_id')
    .notNull()
    .references(() => teams.id),
  participantId: text('participant_id')
    .notNull()
    .references(() => participants.id),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  value: text('value').notNull(),
  viability: text('viability').notNull(),
  visibility: text('visibility').notNull(),
  addedBy: text('added_by').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  upvotedBy: jsonb('upvoted_by').notNull().default('[]'),
  comments: integer('comments').notNull().default(0),
  collaborators: jsonb('collaborators').notNull().default('[]'),
  crossTeamOverlap: text('cross_team_overlap'),
  position: jsonb('position').notNull().default('{"x":0,"y":0}'),
  clusterId: integer('cluster_id'),
  whyItMatters: text('why_it_matters'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insights = pgTable('insights', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  useCaseId: text('use_case_id')
    .notNull()
    .references(() => useCases.id),
  teamId: text('team_id')
    .notNull()
    .references(() => teams.id),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  value: text('value').notNull(),
  viability: text('viability').notNull(),
  visibility: text('visibility').notNull(),
  addedBy: text('added_by').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  tags: jsonb('tags').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scores = pgTable('scores', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  useCaseId: text('use_case_id')
    .notNull()
    .references(() => useCases.id),
  scoredBy: text('scored_by').notNull(),
  impact: integer('impact').notNull(),
  feasibility: integer('feasibility').notNull(),
  alignment: integer('alignment').notNull(),
  executiveWeight: integer('executive_weight').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promotions = pgTable('promotions', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  useCaseId: text('use_case_id')
    .notNull()
    .references(() => useCases.id),
  promotedBy: text('promoted_by').notNull(),
  targetType: text('target_type').notNull(),
  promotedAt: timestamp('promoted_at').defaultNow().notNull(),
});

export const workshopSummaries = pgTable('workshop_summaries', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id),
  content: jsonb('content').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});
