export type WorkshopStatus = 'setup' | 'live' | 'summary';
export type RatingLevel = 'High' | 'Medium' | 'Low';
export type Visibility = 'Internal' | 'Restricted' | 'Cross-Silo';
export type Presence = 'in-room' | 'remote';

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

export interface Workshop {
  id: string;
  title: string;
  client: string;
  status: WorkshopStatus;
  createdAt: string;
  agenda: AgendaItem[];
}

export interface Participant {
  id: string;
  workshopId: string;
  name: string;
  role: string;
  presence: Presence;
  teamId?: string;
  initials: string;
  color: string;
}

export interface BreakoutTeam {
  id: string;
  workshopId: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

export interface UseCase {
  id: string;
  workshopId: string;
  teamId: string;
  title: string;
  summary: string;
  value: RatingLevel;
  viability: RatingLevel;
  visibility: Visibility;
  addedBy: string;
  participantId: string;
  createdAt: string;
  position: { x: number; y: number };
  clusterId?: number;
  upvotes: number;
  upvotedBy: string[];
  comments: number;
  collaborators: string[];
  crossTeamOverlap?: string;
  insightId: string;
}

export interface Insight {
  id: string;
  workshopId: string;
  useCaseId: string;
  teamId: string;
  title: string;
  summary: string;
  value: RatingLevel;
  viability: RatingLevel;
  visibility: Visibility;
  addedBy: string;
  createdAt: string;
  upvotes: number;
  tags: string[];
  similarityScore?: number;
  similarTo?: string;
}

export type WorkshopEventType =
  | 'usecase_added'
  | 'usecase_updated'
  | 'usecase_upvoted'
  | 'usecase_deleted'
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'insight_generated'
  | 'participant_joined'
  | 'participant_left';

export interface WorkshopEvent {
  type: WorkshopEventType;
  workshopId: string;
  data: unknown;
  timestamp: string;
}
