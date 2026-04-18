import { randomUUID } from 'crypto';
import type {
  Workshop,
  BreakoutTeam,
  Participant,
  UseCase,
  Insight,
  Comment,
  WorkshopEvent,
  WorkshopEventType,
  Score,
  Promotion,
  RankedUseCase,
  WorkshopSummary,
} from './types.js';

// ── In-memory stores ──────────────────────────────────────────────────────────

export const workshops = new Map<string, Workshop>();
export const teams = new Map<string, BreakoutTeam>();
export const participants = new Map<string, Participant>();
export const useCases = new Map<string, UseCase>();
export const insights = new Map<string, Insight>();
export const comments = new Map<string, Comment[]>(); // useCaseId -> comments
export const scores = new Map<string, Score>();
export const promotions = new Map<string, Promotion>();
export const summaries = new Map<string, WorkshopSummary>();

// SSE: workshopId -> Set of controller enqueue functions
type Enqueuer = (event: WorkshopEvent) => void;
const sseClients = new Map<string, Set<Enqueuer>>();

// ── SSE helpers ───────────────────────────────────────────────────────────────

export function subscribeTo(workshopId: string, enqueue: Enqueuer): () => void {
  if (!sseClients.has(workshopId)) sseClients.set(workshopId, new Set());
  sseClients.get(workshopId)!.add(enqueue);
  return () => sseClients.get(workshopId)?.delete(enqueue);
}

export function broadcast(workshopId: string, type: WorkshopEventType, data: unknown): void {
  const event: WorkshopEvent = { type, workshopId, data, timestamp: new Date().toISOString() };
  sseClients.get(workshopId)?.forEach((enqueue) => enqueue(event));
}

// ── Derived queries ───────────────────────────────────────────────────────────

export function getWorkshopTeams(workshopId: string): BreakoutTeam[] {
  return [...teams.values()].filter((t) => t.workshopId === workshopId);
}

export function getWorkshopParticipants(workshopId: string): Participant[] {
  return [...participants.values()].filter((p) => p.workshopId === workshopId);
}

export function getWorkshopUseCases(workshopId: string, teamId?: string): UseCase[] {
  return [...useCases.values()].filter(
    (uc) => uc.workshopId === workshopId && (!teamId || uc.teamId === teamId)
  );
}

export function getWorkshopInsights(workshopId: string): Insight[] {
  return [...insights.values()].filter((i) => i.workshopId === workshopId);
}

export function getComments(useCaseId: string): Comment[] {
  return comments.get(useCaseId) ?? [];
}

export function createComment(input: {
  useCaseId: string;
  participantId: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  workshopId: string;
}): Comment {
  const comment: Comment = {
    id: randomUUID(),
    useCaseId: input.useCaseId,
    participantId: input.participantId,
    authorName: input.authorName,
    authorInitials: input.authorInitials,
    authorColor: input.authorColor,
    content: input.content,
    createdAt: new Date().toISOString(),
  };
  const existing = comments.get(input.useCaseId) ?? [];
  comments.set(input.useCaseId, [...existing, comment]);

  // Increment comment count on the use case
  const uc = useCases.get(input.useCaseId);
  if (uc) useCases.set(input.useCaseId, { ...uc, commentCount: (uc.commentCount ?? 0) + 1 });

  broadcast(input.workshopId, 'comment_added', { useCaseId: input.useCaseId, comment });
  return comment;
}

export function createParticipant(input: {
  id: string;
  workshopId: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  teamId: string;
}): Participant {
  const participant: Participant = {
    id: input.id,
    workshopId: input.workshopId,
    name: input.name,
    role: input.role,
    presence: 'remote',
    teamId: input.teamId,
    initials: input.initials,
    color: input.color,
  };
  participants.set(input.id, participant);

  // Add to team
  const team = teams.get(input.teamId);
  if (team && !team.memberIds.includes(input.id)) {
    teams.set(input.teamId, { ...team, memberIds: [...team.memberIds, input.id] });
  }

  broadcast(input.workshopId, 'participant_joined', participant);
  return participant;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function createTeam(
  workshopId: string,
  name: string,
  memberIds: string[] = []
): BreakoutTeam {
  const team: BreakoutTeam = {
    id: randomUUID(),
    workshopId,
    name,
    memberIds,
    createdAt: new Date().toISOString(),
  };
  teams.set(team.id, team);
  // Assign participants to this team
  for (const pid of memberIds) {
    const p = participants.get(pid);
    if (p) participants.set(pid, { ...p, teamId: team.id });
  }
  broadcast(workshopId, 'team_created', team);
  return team;
}

export function updateTeam(
  teamId: string,
  patch: Partial<Pick<BreakoutTeam, 'name' | 'memberIds'>>
): BreakoutTeam | null {
  const team = teams.get(teamId);
  if (!team) return null;
  const updated = { ...team, ...patch };
  teams.set(teamId, updated);
  if (patch.memberIds) {
    for (const pid of patch.memberIds) {
      const p = participants.get(pid);
      if (p) participants.set(pid, { ...p, teamId });
    }
  }
  broadcast(team.workshopId, 'team_updated', updated);
  return updated;
}

export function deleteTeam(teamId: string): boolean {
  const team = teams.get(teamId);
  if (!team) return false;
  // Unassign participants
  for (const pid of team.memberIds) {
    const p = participants.get(pid);
    if (p) participants.set(pid, { ...p, teamId: undefined });
  }
  teams.delete(teamId);
  broadcast(team.workshopId, 'team_deleted', { id: teamId });
  return true;
}

export function addTeamMember(teamId: string, participantId: string): BreakoutTeam | null {
  const team = teams.get(teamId);
  if (!team) return null;
  if (team.memberIds.includes(participantId)) return team;
  return updateTeam(teamId, { memberIds: [...team.memberIds, participantId] });
}

export function removeTeamMember(teamId: string, participantId: string): BreakoutTeam | null {
  const team = teams.get(teamId);
  if (!team) return null;
  return updateTeam(teamId, { memberIds: team.memberIds.filter((id) => id !== participantId) });
}

export function createUseCase(input: {
  workshopId: string;
  teamId: string;
  title: string;
  summary: string;
  value: UseCase['value'];
  viability: UseCase['viability'];
  visibility: UseCase['visibility'];
  addedBy: string;
  participantId: string;
  position?: { x: number; y: number };
  collaborators?: string[];
}): { useCase: UseCase; insight: Insight } {
  const insightId = randomUUID();
  const useCaseId = randomUUID();
  const now = new Date().toISOString();

  const useCase: UseCase = {
    id: useCaseId,
    workshopId: input.workshopId,
    teamId: input.teamId,
    title: input.title,
    summary: input.summary,
    value: input.value,
    viability: input.viability,
    visibility: input.visibility,
    addedBy: input.addedBy,
    participantId: input.participantId,
    createdAt: now,
    position: input.position ?? { x: Math.floor(Math.random() * 600), y: Math.floor(Math.random() * 400) },
    upvotes: 0,
    upvotedBy: [],
    commentCount: 0,
    collaborators: input.collaborators ?? [input.addedBy],
    insightId,
  };

  // Detect cross-team overlap: any existing use case in the same workshop with similar title keywords
  const existing = getWorkshopUseCases(input.workshopId);
  const titleWords = input.title.toLowerCase().split(/\s+/);
  for (const uc of existing) {
    if (uc.teamId === input.teamId) continue;
    const otherWords = uc.title.toLowerCase().split(/\s+/);
    const overlap = titleWords.filter((w) => w.length > 4 && otherWords.includes(w));
    if (overlap.length > 0) {
      const otherTeam = teams.get(uc.teamId);
      if (otherTeam) {
        useCase.crossTeamOverlap = otherTeam.name;
        break;
      }
    }
  }

  useCases.set(useCaseId, useCase);

  // Auto-populate insights database
  const insight: Insight = {
    id: insightId,
    workshopId: input.workshopId,
    useCaseId,
    teamId: input.teamId,
    title: input.title,
    summary: input.summary,
    value: input.value,
    viability: input.viability,
    visibility: input.visibility,
    addedBy: input.addedBy,
    createdAt: now,
    upvotes: 0,
    tags: [input.value, input.viability, input.visibility],
  };
  insights.set(insightId, insight);

  broadcast(input.workshopId, 'usecase_added', useCase);
  return { useCase, insight };
}

export function updateUseCase(
  useCaseId: string,
  patch: Partial<Pick<UseCase, 'title' | 'summary' | 'value' | 'viability' | 'visibility' | 'position' | 'clusterId' | 'collaborators'>>
): UseCase | null {
  const uc = useCases.get(useCaseId);
  if (!uc) return null;
  const updated = { ...uc, ...patch };
  useCases.set(useCaseId, updated);

  // Keep insight in sync
  const insight = insights.get(uc.insightId);
  if (insight) {
    insights.set(uc.insightId, {
      ...insight,
      title: updated.title,
      summary: updated.summary,
      value: updated.value,
      viability: updated.viability,
      visibility: updated.visibility,
      tags: [updated.value, updated.viability, updated.visibility],
    });
  }

  broadcast(uc.workshopId, 'usecase_updated', updated);
  return updated;
}

export function upvoteUseCase(useCaseId: string, participantId: string): UseCase | null {
  const uc = useCases.get(useCaseId);
  if (!uc) return null;
  if (uc.upvotedBy.includes(participantId)) return uc; // already voted
  const updated = { ...uc, upvotes: uc.upvotes + 1, upvotedBy: [...uc.upvotedBy, participantId] };
  useCases.set(useCaseId, updated);

  const insight = insights.get(uc.insightId);
  if (insight) insights.set(uc.insightId, { ...insight, upvotes: updated.upvotes });

  broadcast(uc.workshopId, 'usecase_upvoted', { id: useCaseId, upvotes: updated.upvotes });
  return updated;
}

export function deleteUseCase(useCaseId: string): boolean {
  const uc = useCases.get(useCaseId);
  if (!uc) return false;
  useCases.delete(useCaseId);
  insights.delete(uc.insightId);
  broadcast(uc.workshopId, 'usecase_deleted', { id: useCaseId });
  return true;
}

// ── Post-Workshop functions ───────────────────────────────────────────────────

export function addScore(input: {
  workshopId: string;
  useCaseId: string;
  scoredBy: string;
  impact: number;
  feasibility: number;
  alignment: number;
  executiveWeight: number;
  notes?: string;
}): Score {
  // Check if this user has already scored this use case
  const existingScores = [...scores.values()].filter(
    (s) => s.useCaseId === input.useCaseId && s.scoredBy === input.scoredBy
  );

  let score: Score;
  if (existingScores.length > 0) {
    // Update existing score
    const existing = existingScores[0];
    score = {
      ...existing,
      impact: input.impact,
      feasibility: input.feasibility,
      alignment: input.alignment,
      executiveWeight: input.executiveWeight,
      notes: input.notes,
    };
    scores.set(existing.id, score);
  } else {
    // Create new score
    score = {
      id: randomUUID(),
      workshopId: input.workshopId,
      useCaseId: input.useCaseId,
      scoredBy: input.scoredBy,
      impact: input.impact,
      feasibility: input.feasibility,
      alignment: input.alignment,
      executiveWeight: input.executiveWeight,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    scores.set(score.id, score);
  }

  broadcast(input.workshopId, 'usecase_scored', score);
  return score;
}

export function getScoresByUseCaseId(useCaseId: string): Score[] {
  return [...scores.values()].filter((s) => s.useCaseId === useCaseId);
}

export function getScoresByWorkshopId(workshopId: string): Score[] {
  return [...scores.values()].filter((s) => s.workshopId === workshopId);
}

export function promoteUseCase(
  useCaseId: string,
  promotedBy: string,
  targetType: 'pipeline' | 'mvbc'
): Promotion {
  const uc = useCases.get(useCaseId);
  if (!uc) throw new Error('Use case not found');

  const promotion: Promotion = {
    id: randomUUID(),
    workshopId: uc.workshopId,
    useCaseId,
    promotedBy,
    targetType,
    promotedAt: new Date().toISOString(),
  };
  promotions.set(promotion.id, promotion);

  broadcast(uc.workshopId, 'usecase_promoted', promotion);
  return promotion;
}

export function getPromotionsByWorkshopId(workshopId: string): Promotion[] {
  return [...promotions.values()].filter((p) => p.workshopId === workshopId);
}

export function calculateStackRank(workshopId: string): RankedUseCase[] {
  const workshopUseCases = getWorkshopUseCases(workshopId);

  const ranked: RankedUseCase[] = workshopUseCases.map((uc) => {
    const ucScores = getScoresByUseCaseId(uc.id);

    let impactAvg = 0;
    let feasibilityAvg = 0;
    let alignmentAvg = 0;
    let executiveWeightAvg = 0;
    const scoreCount = ucScores.length;

    if (scoreCount > 0) {
      impactAvg = ucScores.reduce((sum, s) => sum + s.impact, 0) / scoreCount;
      feasibilityAvg = ucScores.reduce((sum, s) => sum + s.feasibility, 0) / scoreCount;
      alignmentAvg = ucScores.reduce((sum, s) => sum + s.alignment, 0) / scoreCount;
      executiveWeightAvg = ucScores.reduce((sum, s) => sum + s.executiveWeight, 0) / scoreCount;
    }

    const finalScore = (impactAvg * feasibilityAvg) + (2 * uc.upvotes) + executiveWeightAvg;

    return {
      ...uc,
      finalScore,
      impactAvg,
      feasibilityAvg,
      alignmentAvg,
      executiveWeightAvg,
      scoreCount,
    };
  });

  return ranked.sort((a, b) => b.finalScore - a.finalScore);
}

export function saveSummary(workshopId: string, content: string): WorkshopSummary {
  const summary: WorkshopSummary = {
    id: randomUUID(),
    workshopId,
    content,
    generatedAt: new Date().toISOString(),
  };
  summaries.set(workshopId, summary);

  broadcast(workshopId, 'summary_generated', summary);
  return summary;
}

export function getSummary(workshopId: string): WorkshopSummary | null {
  return summaries.get(workshopId) ?? null;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

function seed(): void {
  const workshopId = 'workshop-1';

  const workshop: Workshop = {
    id: workshopId,
    title: 'Clinical Operations AI Workshop',
    client: 'Metro Health System',
    status: 'live',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    agenda: [
      { id: 'a1', title: 'Current State', description: 'Map existing workflow', isActive: false },
      { id: 'a2', title: 'Pain Points', description: 'Identify bottlenecks & inefficiencies', isActive: true },
      { id: 'a3', title: 'AI Opportunities', description: 'Explore automation potential', isActive: false },
      { id: 'a4', title: 'Viability', description: 'Assess implementation readiness', isActive: false },
    ],
  };
  workshops.set(workshopId, workshop);

  const pSarah: Participant = { id: 'p1', workshopId, name: 'Dr. Sarah Chen', role: 'Clinical Lead', presence: 'in-room', initials: 'SC', color: 'bg-green-500' };
  const pMichael: Participant = { id: 'p2', workshopId, name: 'Michael Torres', role: 'Ops Director', presence: 'remote', initials: 'MT', color: 'bg-blue-500' };
  const pJamie: Participant = { id: 'p3', workshopId, name: 'Jamie Liu', role: 'Data Analyst', presence: 'remote', initials: 'JL', color: 'bg-purple-500' };
  participants.set(pSarah.id, pSarah);
  participants.set(pMichael.id, pMichael);
  participants.set(pJamie.id, pJamie);

  const teamA = createTeam(workshopId, 'Team A', [pSarah.id, pJamie.id]);
  const teamB = createTeam(workshopId, 'Team B', [pMichael.id]);

  const seedCases: Array<Parameters<typeof createUseCase>[0]> = [
    { workshopId, teamId: teamA.id, title: 'Intake form duplication', summary: 'Multiple manual re-entry points across EHR systems', value: 'High', viability: 'Medium', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 80, y: 60 }, collaborators: [pSarah.name, pJamie.name] },
    { workshopId, teamId: teamA.id, title: 'Insurance verification lag', summary: 'Manual insurance checks delay intake by 24-48 hours', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 420, y: 80 } },
    { workshopId, teamId: teamA.id, title: 'Duplicate patient records', summary: 'Cross-system duplicates causing clinical confusion and delays', value: 'High', viability: 'Low', visibility: 'Cross-Silo', addedBy: pJamie.name, participantId: pJamie.id, position: { x: 170, y: 190 } },
    { workshopId, teamId: teamA.id, title: 'Manual fax processing', summary: 'Prior auth requests require manual fax review', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: pJamie.name, participantId: pJamie.id, position: { x: 600, y: 70 } },
    { workshopId, teamId: teamB.id, title: 'EHR data sync delays', summary: 'Patient data not syncing in real-time between systems', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', addedBy: pMichael.name, participantId: pMichael.id, position: { x: 290, y: 60 } },
    { workshopId, teamId: teamB.id, title: 'Referral letter generation', summary: 'Physicians spending 20 min per referral on paperwork', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: pMichael.name, participantId: pMichael.id, position: { x: 700, y: 200 } },
    { workshopId, teamId: teamB.id, title: 'Scheduling conflicts', summary: 'No real-time visibility across department schedules', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: pMichael.name, participantId: pMichael.id, position: { x: 80, y: 420 } },
    { workshopId, teamId: teamA.id, title: 'Care coordination gaps', summary: 'Post-discharge follow-up falls through the cracks', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', addedBy: pJamie.name, participantId: pJamie.id, position: { x: 310, y: 400 } },
    { workshopId, teamId: teamA.id, title: 'Fragmented care notes', summary: 'Clinical notes scattered across 3 separate platforms', value: 'High', viability: 'Medium', visibility: 'Restricted', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 190, y: 540 } },
  ];

  for (const uc of seedCases) {
    const { useCase } = createUseCase(uc);
  }
}

seed();
