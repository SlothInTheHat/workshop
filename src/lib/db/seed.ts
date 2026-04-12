import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from './index.js';
import * as schema from './schema.js';
import { eq, count } from 'drizzle-orm';

export async function seedIfEmpty() {
  if (!isDatabaseEnabled || !db) {
    console.log('[Seed] Database not enabled, skipping seed');
    return;
  }

  try {
    // Check if workshops table has data
    const result = await db.select({ count: count() }).from(schema.workshops);
    const workshopCount = result[0].count;

    if (workshopCount > 0) {
      console.log('[Seed] Database already seeded, skipping');
      return;
    }

    console.log('[Seed] Seeding database with clinical workshop...');

    // Create workshop
    const workshopId = 'workshop-1';
    await db.insert(schema.workshops).values({
      id: workshopId,
      title: 'Clinical Operations AI Workshop',
      client: 'Metro Health System',
      status: 'live',
      createdAt: new Date(Date.now() - 3600_000),
      agenda: [
        { id: 'a1', title: 'Current State', description: 'Map existing workflow', isActive: false },
        { id: 'a2', title: 'Pain Points', description: 'Identify bottlenecks & inefficiencies', isActive: true },
        { id: 'a3', title: 'AI Opportunities', description: 'Explore automation potential', isActive: false },
        { id: 'a4', title: 'Viability', description: 'Assess implementation readiness', isActive: false },
      ],
    });

    // Create participants
    const participants = [
      { id: 'p1', name: 'Dr. Sarah Chen', role: 'Clinical Lead', presence: 'in-room', initials: 'SC', color: 'bg-green-500' },
      { id: 'p2', name: 'Michael Torres', role: 'Ops Director', presence: 'remote', initials: 'MT', color: 'bg-blue-500' },
      { id: 'p3', name: 'Jamie Liu', role: 'Data Analyst', presence: 'remote', initials: 'JL', color: 'bg-purple-500' },
    ];

    for (const p of participants) {
      await db.insert(schema.participants).values({
        id: p.id,
        workshopId,
        name: p.name,
        role: p.role,
        presence: p.presence as 'in-room' | 'remote',
        initials: p.initials,
        color: p.color,
      });
    }

    // Create teams
    const teamA = { id: randomUUID(), name: 'Team A', memberIds: ['p1', 'p3'] };
    const teamB = { id: randomUUID(), name: 'Team B', memberIds: ['p2'] };

    await db.insert(schema.teams).values([
      { id: teamA.id, workshopId, name: teamA.name, memberIds: teamA.memberIds },
      { id: teamB.id, workshopId, name: teamB.name, memberIds: teamB.memberIds },
    ]);

    // Update participants with team assignments
    await db.update(schema.participants).set({ teamId: teamA.id }).where(eq(schema.participants.id, 'p1'));
    await db.update(schema.participants).set({ teamId: teamA.id }).where(eq(schema.participants.id, 'p3'));
    await db.update(schema.participants).set({ teamId: teamB.id }).where(eq(schema.participants.id, 'p2'));

    // Create use cases with corresponding insights
    const useCaseData = [
      { teamId: teamA.id, participantId: 'p1', participantName: 'Dr. Sarah Chen', title: 'Intake form duplication', summary: 'Multiple manual re-entry points across EHR systems', value: 'High', viability: 'Medium', visibility: 'Internal', position: { x: 80, y: 60 }, collaborators: ['Dr. Sarah Chen', 'Jamie Liu'] },
      { teamId: teamA.id, participantId: 'p1', participantName: 'Dr. Sarah Chen', title: 'Insurance verification lag', summary: 'Manual insurance checks delay intake by 24-48 hours', value: 'Medium', viability: 'High', visibility: 'Internal', position: { x: 420, y: 80 }, collaborators: ['Dr. Sarah Chen'] },
      { teamId: teamA.id, participantId: 'p3', participantName: 'Jamie Liu', title: 'Duplicate patient records', summary: 'Cross-system duplicates causing clinical confusion and delays', value: 'High', viability: 'Low', visibility: 'Cross-Silo', position: { x: 170, y: 190 }, collaborators: ['Jamie Liu'] },
      { teamId: teamA.id, participantId: 'p3', participantName: 'Jamie Liu', title: 'Manual fax processing', summary: 'Prior auth requests require manual fax review', value: 'Medium', viability: 'High', visibility: 'Internal', position: { x: 600, y: 70 }, collaborators: ['Jamie Liu'] },
      { teamId: teamB.id, participantId: 'p2', participantName: 'Michael Torres', title: 'EHR data sync delays', summary: 'Patient data not syncing in real-time between systems', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', position: { x: 290, y: 60 }, collaborators: ['Michael Torres'] },
      { teamId: teamB.id, participantId: 'p2', participantName: 'Michael Torres', title: 'Referral letter generation', summary: 'Physicians spending 20 min per referral on paperwork', value: 'Medium', viability: 'High', visibility: 'Internal', position: { x: 700, y: 200 }, collaborators: ['Michael Torres'] },
      { teamId: teamB.id, participantId: 'p2', participantName: 'Michael Torres', title: 'Scheduling conflicts', summary: 'No real-time visibility across department schedules', value: 'Medium', viability: 'High', visibility: 'Internal', position: { x: 80, y: 420 }, collaborators: ['Michael Torres'] },
      { teamId: teamA.id, participantId: 'p3', participantName: 'Jamie Liu', title: 'Care coordination gaps', summary: 'Post-discharge follow-up falls through the cracks', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', position: { x: 310, y: 400 }, collaborators: ['Jamie Liu'] },
      { teamId: teamA.id, participantId: 'p1', participantName: 'Dr. Sarah Chen', title: 'Fragmented care notes', summary: 'Clinical notes scattered across 3 separate platforms', value: 'High', viability: 'Medium', visibility: 'Restricted', position: { x: 190, y: 540 }, collaborators: ['Dr. Sarah Chen'] },
    ];

    for (const uc of useCaseData) {
      const useCaseId = randomUUID();
      const insightId = randomUUID();

      // Insert use case (NO upvotes - clean slate)
      await db.insert(schema.useCases).values({
        id: useCaseId,
        workshopId,
        teamId: uc.teamId,
        participantId: uc.participantId,
        title: uc.title,
        summary: uc.summary,
        value: uc.value,
        viability: uc.viability,
        visibility: uc.visibility,
        addedBy: uc.participantName,
        upvotes: 0,
        upvotedBy: [],
        comments: 0,
        collaborators: uc.collaborators,
        position: uc.position,
      });

      // Insert corresponding insight
      await db.insert(schema.insights).values({
        id: insightId,
        workshopId,
        useCaseId,
        teamId: uc.teamId,
        title: uc.title,
        summary: uc.summary,
        value: uc.value,
        viability: uc.viability,
        visibility: uc.visibility,
        addedBy: uc.participantName,
        upvotes: 0,
        tags: [uc.value, uc.viability, uc.visibility],
      });
    }

    console.log('[Seed] Database seeded successfully with clinical workshop');
  } catch (err) {
    console.error('[Seed] Failed to seed database:', err);
    throw err;
  }
}
