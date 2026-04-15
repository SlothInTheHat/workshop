import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

// ─── Pre-Workshop Schema ──────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	domain: text('domain'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const preWorkshops = pgTable('pre_workshops', {
	id: text('id').primaryKey(),
	tenantId: text('tenant_id').notNull(),
	title: text('title').notNull(),
	focusArea: text('focus_area'),
	objective: text('objective'),
	status: text('status').notNull().default('draft'), // draft | pre | live | completed
	dataSensitivity: text('data_sensitivity').notNull().default('internal'), // internal | phi | deidentified
	leadFacilitatorName: text('lead_facilitator_name'),
	aiContext: text('ai_context'),
	kickoffSummary: text('kickoff_summary'),
	facilitatorCode: text('facilitator_code'),
	contributorCode: text('contributor_code'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const preParticipants = pgTable('pre_participants', {
	id: text('id').primaryKey(),
	workshopId: text('workshop_id').notNull(),
	tenantId: text('tenant_id').notNull(),
	name: text('name').notNull(),
	email: text('email'),
	role: text('role').notNull().default('contributor'), // facilitator | contributor | executive
	status: text('status').notNull().default('pending'), // pending | in_progress | completed
	createdAt: timestamp('created_at').defaultNow().notNull()
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
	completionPct: integer('completion_pct').notNull().default(0),
	status: text('status').notNull().default('pending'), // pending | in_progress | completed
	submittedAt: timestamp('submitted_at')
});

export const artifacts = pgTable('artifacts', {
	id: text('id').primaryKey(),
	workshopId: text('workshop_id').notNull(),
	tenantId: text('tenant_id').notNull(),
	uploadedBy: text('uploaded_by').notNull(),
	type: text('type').notNull().default('document'), // document | link | image
	title: text('title').notNull(),
	storageUrl: text('storage_url').notNull(),
	visibility: text('visibility').notNull().default('all'), // all | facilitators | contributors
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const activityLogs = pgTable('activity_logs', {
	id: text('id').primaryKey(),
	workshopId: text('workshop_id').notNull(),
	tenantId: text('tenant_id').notNull(),
	actorName: text('actor_name').notNull(),
	action: text('action').notNull(),
	details: text('details'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ─── Live Workshop Schema ─────────────────────────────────────────────────────

export const workshops = pgTable('workshops', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	client: text('client').notNull(),
	status: text('status').notNull().default('setup'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	agenda: jsonb('agenda'),
	objectives: jsonb('objectives').default('[]'),
	strategicPillars: jsonb('strategic_pillars').default('[]'),
	finishedVoting: jsonb('finished_voting').default('[]')
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
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const teams = pgTable('teams', {
	id: text('id').primaryKey(),
	workshopId: text('workshop_id')
		.notNull()
		.references(() => workshops.id),
	name: text('name').notNull(),
	memberIds: jsonb('member_ids').notNull().default('[]'),
	createdAt: timestamp('created_at').defaultNow().notNull()
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
	createdAt: timestamp('created_at').defaultNow().notNull()
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
	createdAt: timestamp('created_at').defaultNow().notNull()
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
	createdAt: timestamp('created_at').defaultNow().notNull()
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
	promotedAt: timestamp('promoted_at').defaultNow().notNull()
});

export const workshopSummaries = pgTable('workshop_summaries', {
	id: text('id').primaryKey(),
	workshopId: text('workshop_id')
		.notNull()
		.references(() => workshops.id),
	content: jsonb('content').notNull(),
	generatedAt: timestamp('generated_at').defaultNow().notNull()
});
