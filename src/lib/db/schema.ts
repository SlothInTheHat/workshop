import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  real,
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
  visibility: text('visibility').notNull(),
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
  value: text('value').notNull(),
  viability: text('viability').notNull(),
  visibility: text('visibility').notNull(),
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
