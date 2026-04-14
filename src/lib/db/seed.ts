/**
 * Seed script — run once to populate demo data.
 * Usage: npm run db:seed
 */
import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from './schema.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  // Only seed if no workshops exist
  const existing = await db.select().from(schema.workshops).limit(1);
  if (existing.length > 0) {
    console.log('Database already seeded — skipping.');
    await pool.end();
    return;
  }

  console.log('Seeding database...');

  const workshopId = 'workshop-1';

  // Workshop
  await db.insert(schema.workshops).values({
    id: workshopId,
    title: 'Clinical Operations AI Workshop',
    client: 'Metro Health System',
    status: 'live',
    joinCode: 'METRO-2026',
  });

  // Agenda
  await db.insert(schema.agendaItems).values([
    { id: 'a1', workshopId, title: 'Current State', description: 'Map existing workflow', isActive: false, sortOrder: 0 },
    { id: 'a2', workshopId, title: 'Pain Points', description: 'Identify bottlenecks & inefficiencies', isActive: true, sortOrder: 1 },
    { id: 'a3', workshopId, title: 'AI Opportunities', description: 'Explore automation potential', isActive: false, sortOrder: 2 },
    { id: 'a4', workshopId, title: 'Viability', description: 'Assess implementation readiness', isActive: false, sortOrder: 3 },
  ]);

  // Demo users
  const users = [
    { id: 'u1', email: 'sarah@demo.com', name: 'Dr. Sarah Chen', role: 'Clinical Lead', initials: 'SC', color: 'bg-green-500' },
    { id: 'u2', email: 'michael@demo.com', name: 'Michael Torres', role: 'Ops Director', initials: 'MT', color: 'bg-blue-500' },
    { id: 'u3', email: 'jamie@demo.com', name: 'Jamie Liu', role: 'Data Analyst', initials: 'JL', color: 'bg-purple-500' },
  ];

  // Placeholder hashed password (password: "demo1234")
  // In production users register via /auth/register
  const placeholderHash = '$argon2id$v=19$m=65536,t=3,p=4$placeholder$placeholder';

  await db.insert(schema.users).values(
    users.map(u => ({ ...u, hashedPassword: placeholderHash }))
  );

  // Teams
  const teamAId = 'team-a';
  const teamBId = 'team-b';
  await db.insert(schema.breakoutTeams).values([
    { id: teamAId, workshopId, name: 'Team A' },
    { id: teamBId, workshopId, name: 'Team B' },
  ]);

  // Participants (join users to workshop)
  const pSarahId = 'p1';
  const pMichaelId = 'p2';
  const pJamieId = 'p3';
  await db.insert(schema.workshopParticipants).values([
    { id: pSarahId, workshopId, userId: 'u1', presence: 'in-room', teamId: teamAId },
    { id: pMichaelId, workshopId, userId: 'u2', presence: 'remote', teamId: teamBId },
    { id: pJamieId, workshopId, userId: 'u3', presence: 'remote', teamId: teamAId },
  ]);

  // Use cases with paired insights
  const useCaseData = [
    { teamId: teamAId, participantId: pSarahId, title: 'Intake Form Auto-Fill', summary: 'Use AI to pre-populate intake forms from referral documents, reducing manual entry.', value: 'High', viability: 'High', visibility: 'Internal', addedBy: 'Dr. Sarah Chen', px: 80, py: 60 },
    { teamId: teamAId, participantId: pJamieId, title: 'Insurance Verification Bot', summary: 'Automate real-time insurance eligibility checks at point of scheduling.', value: 'High', viability: 'Medium', visibility: 'Internal', addedBy: 'Jamie Liu', px: 320, py: 60 },
    { teamId: teamAId, participantId: pSarahId, title: 'Duplicate Record Detector', summary: 'ML model to flag potential duplicate patient records across EHR systems.', value: 'Medium', viability: 'Medium', visibility: 'Cross-Silo', addedBy: 'Dr. Sarah Chen', px: 80, py: 300 },
    { teamId: teamAId, participantId: pJamieId, title: 'Fax-to-Referral Extraction', summary: 'OCR + NLP pipeline to convert incoming faxes into structured referral records.', value: 'High', viability: 'High', visibility: 'Internal', addedBy: 'Jamie Liu', px: 320, py: 300 },
    { teamId: teamAId, participantId: pSarahId, title: 'EHR Data Sync Monitor', summary: 'Real-time alerting when EHR sync jobs fail or produce inconsistent records.', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: 'Dr. Sarah Chen', px: 560, py: 60 },
    { teamId: teamBId, participantId: pMichaelId, title: 'Referral Status Tracker', summary: 'Automated outbound status updates to referring physicians via portal or SMS.', value: 'High', viability: 'Medium', visibility: 'Restricted', addedBy: 'Michael Torres', px: 80, py: 60 },
    { teamId: teamBId, participantId: pMichaelId, title: 'Smart Scheduling Assistant', summary: 'AI that resolves scheduling conflicts and optimises appointment slots.', value: 'High', viability: 'Low', visibility: 'Internal', addedBy: 'Michael Torres', px: 320, py: 60 },
    { teamId: teamBId, participantId: pMichaelId, title: 'Care Gap Identification', summary: 'Predictive model to surface patients overdue for follow-up or preventive care.', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', addedBy: 'Michael Torres', px: 80, py: 300 },
    { teamId: teamBId, participantId: pMichaelId, title: 'Clinical Notes Summariser', summary: 'LLM summarisation of lengthy clinical notes into concise SOAP-format briefs.', value: 'Medium', viability: 'High', visibility: 'Restricted', addedBy: 'Michael Torres', px: 320, py: 300 },
  ];

  for (const uc of useCaseData) {
    const insightId = randomUUID();
    const useCaseId = randomUUID();

    // Insert insight first (use_case_id set after)
    await db.insert(schema.insights).values({
      id: insightId,
      workshopId,
      teamId: uc.teamId,
      title: uc.title,
      summary: uc.summary,
      value: uc.value,
      viability: uc.viability,
      visibility: uc.visibility,
      addedBy: uc.addedBy,
      tags: [uc.value, uc.viability, uc.visibility],
    });

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
      addedBy: uc.addedBy,
      positionX: uc.px,
      positionY: uc.py,
      insightId,
      collaborators: [uc.addedBy],
    });

    // Back-fill insight.use_case_id
    await db
      .update(schema.insights)
      .set({ useCaseId })
      .where(eq(schema.insights.id, insightId));
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
