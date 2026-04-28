import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  real,
  jsonb,
} from 'drizzle-orm/pg-core';

// ── Workshops ─────────────────────────────────────────────────────────────────

export const workshops = pgTable('workshops', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  client: text('client').notNull(),
  status: text('status').notNull().default('setup'), // 'setup' | 'live' | 'summary'
  joinCode: text('join_code').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agendaItems = pgTable('agenda_items', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

// ── Users & Sessions ──────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('Participant'),
  initials: text('initials').notNull(),
  color: text('color').notNull().default('bg-gray-400'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// ── Teams & Participants ───────────────────────────────────────────────────────

export const breakoutTeams = pgTable('breakout_teams', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  memberIds: jsonb('member_ids').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const liveParticipants = pgTable('live_participants', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('contributor'),
  initials: text('initials').notNull(),
  color: text('color').notNull().default('bg-blue-400'),
  teamId: text('team_id'),
  presence: text('presence').notNull().default('remote'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workshopParticipants = pgTable('workshop_participants', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  presence: text('presence').notNull().default('remote'), // 'in-room' | 'remote'
  teamId: text('team_id').references(() => breakoutTeams.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

// ── Use Cases & Insights ──────────────────────────────────────────────────────

// insight_id on use_cases references insights, creating a circular FK.
// We handle this by making insight_id nullable initially and setting it after both rows exist.
export const insights = pgTable('insights', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id, { onDelete: 'cascade' }),
  useCaseId: text('use_case_id'), // populated after use_case insert; FK set via migration
  teamId: text('team_id')
    .notNull()
    .references(() => breakoutTeams.id),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  value: text('value').notNull(),
  viability: text('viability').notNull(),
  addedBy: text('added_by').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  tags: text('tags').array().notNull().default([]),
  similarityScore: integer('similarity_score'),
  similarTo: text('similar_to'),
  rationale: text('rationale'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const useCases = pgTable('use_cases', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => workshops.id, { onDelete: 'cascade' }),
  teamId: text('team_id')
    .notNull()
    .references(() => breakoutTeams.id),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  context: text('context').default(''),
  value: text('value').notNull(),
  viability: text('viability').notNull(),
  addedBy: text('added_by').notNull(),
  participantId: text('participant_id')
    .notNull()
    .references(() => workshopParticipants.id),
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  clusterId: integer('cluster_id'),
  upvotes: integer('upvotes').notNull().default(0),
  upvotedBy: text('upvoted_by').array().notNull().default([]),
  crossTeamOverlap: text('cross_team_overlap'),
  insightId: text('insight_id')
    .notNull()
    .references(() => insights.id),
  collaborators: text('collaborators').array().notNull().default([]),
  pillarTags: jsonb('pillar_tags').$type<string[]>().default([]),
  problemStatement: text('problem_statement'),
  solutionOverview: text('solution_overview'),
  businessUnits: text('business_units').array().notNull().default([]),
  timeline: text('timeline'),
  costs: text('costs'),
  legalCompliance: text('legal_compliance'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  useCaseId: text('use_case_id')
    .notNull()
    .references(() => useCases.id, { onDelete: 'cascade' }),
  participantId: text('participant_id')
    .notNull()
    .references(() => workshopParticipants.id),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Post-Workshop ─────────────────────────────────────────────────────────────

export const scores = pgTable('scores', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  useCaseId: text('use_case_id').notNull().references(() => useCases.id, { onDelete: 'cascade' }),
  scoredBy: text('scored_by').notNull(),
  impact: integer('impact').notNull(),
  feasibility: integer('feasibility').notNull(),
  alignment: integer('alignment').notNull(),
  executiveWeight: integer('executive_weight').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const promotions = pgTable('promotions', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  useCaseId: text('use_case_id').notNull().references(() => useCases.id, { onDelete: 'cascade' }),
  promotedBy: text('promoted_by').notNull(),
  targetType: text('target_type').notNull(),
  promotedAt: timestamp('promoted_at').notNull().defaultNow(),
});

export const workshopSummaries = pgTable('workshop_summaries', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  content: jsonb('content').notNull(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
});

// ── Pre-Workshop ──────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const preWorkshops = pgTable('pre_workshops', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  title: text('title').notNull(),
  focusArea: text('focus_area'),
  objective: text('objective'),
  status: text('status').notNull().default('draft'),
  dataSensitivity: text('data_sensitivity').notNull().default('internal'),
  leadFacilitatorName: text('lead_facilitator_name'),
  aiContext: text('ai_context'),
  kickoffSummary: text('kickoff_summary'),
  strategicPillars: text('strategic_pillars').array(),
  teams: jsonb('teams').$type<{name: string}[]>().default([]),
  facilitatorCode: text('facilitator_code'),
  contributorCode: text('contributor_code'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const preParticipants = pgTable('pre_participants', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('contributor'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const contributorInputs = pgTable('contributor_inputs', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull(),
  participantId: text('participant_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  goalsAndObjectives: text('goals_and_objectives'),
  painPoints: text('pain_points'),
  currentWorkflow: text('current_workflow'),
  constraints: text('constraints'),
  successCriteria: text('success_criteria'),
  strategicPillars: text('strategic_pillars'),
  completionPct: integer('completion_pct').notNull().default(0),
  status: text('status').notNull().default('pending'),
  submittedAt: timestamp('submitted_at'),
});

export const artifacts = pgTable('artifacts', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  type: text('type').notNull().default('document'),
  title: text('title').notNull(),
  storageUrl: text('storage_url').notNull(),
  visibility: text('visibility').notNull().default('all'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  workshopId: text('workshop_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
