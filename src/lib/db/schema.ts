import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	domain: text('domain'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const workshops = pgTable('workshops', {
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
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const participants = pgTable('participants', {
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
