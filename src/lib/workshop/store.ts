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
import { saveToFile, loadFromFile } from './persist.js';

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

// ── Persistence ───────────────────────────────────────────────────────────────

function loadPersistedData() {
  const data = loadFromFile();
  if (!data) return;

  if (data.workshops) {
    for (const [k, v] of Object.entries(data.workshops)) {
      workshops.set(k, v as any);
    }
  }
  if (data.useCases) {
    for (const [k, v] of Object.entries(data.useCases)) {
      useCases.set(k, v as any);
    }
  }
  if (data.teams) {
    for (const [k, v] of Object.entries(data.teams)) {
      teams.set(k, v as any);
    }
  }
  if (data.participants) {
    for (const [k, v] of Object.entries(data.participants)) {
      participants.set(k, v as any);
    }
  }
  if (data.insights) {
    for (const [k, v] of Object.entries(data.insights)) {
      insights.set(k, v as any);
    }
  }
  if (data.scores) {
    for (const [k, v] of Object.entries(data.scores)) {
      scores.set(k, v as any);
    }
  }
  if (data.summaries) {
    for (const [k, v] of Object.entries(data.summaries)) {
      summaries.set(k, v as any);
    }
  }
  console.log('[Persist] Loaded data from file');
}

export function persistAll() {
  saveToFile({
    workshops: Object.fromEntries(workshops),
    useCases: Object.fromEntries(useCases),
    teams: Object.fromEntries(teams),
    participants: Object.fromEntries(participants),
    insights: Object.fromEntries(insights),
    scores: Object.fromEntries(scores),
    summaries: Object.fromEntries(summaries),
  });
}

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
  context?: string;
  pillarTags?: string[];
  problemStatement?: string;
  solutionOverview?: string;
  businessUnits?: string[];
  timeline?: string;
  costs?: string;
  legalCompliance?: string;
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
    context: input.context ?? '',
    pillarTags: input.pillarTags ?? [],
    problemStatement: input.problemStatement,
    solutionOverview: input.solutionOverview,
    businessUnits: input.businessUnits ?? [],
    timeline: input.timeline,
    costs: input.costs,
    legalCompliance: input.legalCompliance,
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
  persistAll();
  return { useCase, insight };
}

export function updateUseCase(
  useCaseId: string,
  patch: Partial<Pick<UseCase, 'title' | 'summary' | 'value' | 'viability' | 'visibility' | 'position' | 'clusterId' | 'collaborators' | 'context' | 'pillarTags' | 'problemStatement' | 'solutionOverview' | 'businessUnits' | 'timeline' | 'costs' | 'legalCompliance'>>
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
  persistAll();
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
  persistAll();
  return updated;
}

export function deleteUseCase(useCaseId: string): boolean {
  const uc = useCases.get(useCaseId);
  if (!uc) return false;
  useCases.delete(useCaseId);
  insights.delete(uc.insightId);
  broadcast(uc.workshopId, 'usecase_deleted', { id: useCaseId });
  persistAll();
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
  persistAll();
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
  persistAll();
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
  persistAll();
  return summary;
}

export function getSummary(workshopId: string): WorkshopSummary | null {
  return summaries.get(workshopId) ?? null;
}

export function setWorkshopContext(
  workshopId: string,
  context: {
    title: string;
    client: string;
    objective: string;
    aiContext: string;
    contributorInputs: Array<{
      name: string;
      goals: string;
      painPoints: string;
      constraints: string;
      successCriteria: string;
    }>;
    strategicPillars: string[];
  }
) {
  const existing = workshops.get(workshopId);
  if (existing) {
    workshops.set(workshopId, {
      ...existing,
      objective: context.objective,
      aiContext: context.aiContext,
      contributorInputs: context.contributorInputs,
      strategicPillars: context.strategicPillars,
    });
  } else {
    workshops.set(workshopId, {
      id: workshopId,
      title: context.title,
      client: context.client,
      status: 'live',
      createdAt: new Date().toISOString(),
      agenda: [],
      objective: context.objective,
      aiContext: context.aiContext,
      contributorInputs: context.contributorInputs,
      strategicPillars: context.strategicPillars,
    });
  }
  persistAll();
  console.log('[Store] Workshop context set for:', workshopId);
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
    objective: 'Identify and prioritise the highest-value AI use cases that can reduce administrative burden, improve care coordination, and accelerate patient throughput across Metro Health System\'s clinical operations.',
    strategicPillars: ['Patient Experience', 'Operational Efficiency', 'Data Quality', 'Staff Enablement'],
    aiContext: 'Metro Health System operates across 12 facilities with fragmented EHR systems. Key pain points include manual intake processes, slow insurance verification, and poor inter-facility data sync.',
  };
  workshops.set(workshopId, workshop);

  const pSarah: Participant = { id: 'p1', workshopId, name: 'Dr. Sarah Chen', role: 'Clinical Lead', presence: 'in-room', initials: 'SC', color: 'bg-green-500' };
  participants.set(pSarah.id, pSarah);

  const teamA = createTeam(workshopId, 'Team A', [pSarah.id]);
  const teamB = createTeam(workshopId, 'Team B', []);

  const seedCases: Array<Parameters<typeof createUseCase>[0]> = [
    { workshopId, teamId: teamA.id, title: 'Intake Form Auto-Fill', summary: 'Use AI to pre-populate intake forms from referral documents, reducing manual entry.', value: 'High', viability: 'High', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 80, y: 60 }, collaborators: [pSarah.name] },
    { workshopId, teamId: teamA.id, title: 'Insurance Verification Bot', summary: 'Automate real-time insurance eligibility checks at point of scheduling.', value: 'High', viability: 'Medium', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 320, y: 60 } },
    { workshopId, teamId: teamA.id, title: 'Duplicate Record Detector', summary: 'ML model to flag potential duplicate patient records across EHR systems.', value: 'Medium', viability: 'Medium', visibility: 'Cross-Silo', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 80, y: 300 } },
    { workshopId, teamId: teamA.id, title: 'Fax-to-Referral Extraction', summary: 'OCR + NLP pipeline to convert incoming faxes into structured referral records.', value: 'High', viability: 'High', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 320, y: 300 } },
    { workshopId, teamId: teamA.id, title: 'EHR Data Sync Monitor', summary: 'Real-time alerting when EHR sync jobs fail or produce inconsistent records.', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 560, y: 60 } },
    { workshopId, teamId: teamB.id, title: 'Referral Status Tracker', summary: 'Automated outbound status updates to referring physicians via portal or SMS.', value: 'High', viability: 'Medium', visibility: 'Restricted', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 80, y: 60 } },
    { workshopId, teamId: teamB.id, title: 'Smart Scheduling Assistant', summary: 'AI that resolves scheduling conflicts and optimises appointment slots.', value: 'High', viability: 'Low', visibility: 'Internal', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 320, y: 60 } },
    { workshopId, teamId: teamB.id, title: 'Care Gap Identification', summary: 'Predictive model to surface patients overdue for follow-up or preventive care.', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 80, y: 300 } },
    { workshopId, teamId: teamB.id, title: 'Clinical Notes Summariser', summary: 'LLM summarisation of lengthy clinical notes into concise SOAP-format briefs.', value: 'Medium', viability: 'High', visibility: 'Restricted', addedBy: pSarah.name, participantId: pSarah.id, position: { x: 320, y: 300 } },
  ];

  for (const uc of seedCases) {
    const { useCase } = createUseCase(uc);
  }
}

// Load persisted data first
loadPersistedData();

// Always seed the in-memory store with workshop-1 for fallback/testing
seed();
