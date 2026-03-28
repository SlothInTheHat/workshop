import { Plus, Search, ChevronDown, ChevronRight, ChevronLeft, Sparkles, X, ZoomIn, ZoomOut, Users, User, GripVertical, MessageSquare, ArrowUp } from 'lucide-react';
import { useState, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableUsecaseCard } from './DraggableUsecaseCard';
import { AIAnalystCenter } from './AIAnalystCenter';
import { UsecaseListPopup } from './UsecaseListPopup';

interface WorkshopLiveProps {
  onBackToDashboard?: () => void;
  onCompleteWorkshop?: () => void;
}

interface UsecaseCard {
  id: string;
  title: string;
  summary: string;
  value: 'High' | 'Medium' | 'Low';
  viability: 'High' | 'Medium' | 'Low';
  visibility: 'Internal' | 'Restricted' | 'Cross-Silo';
  addedBy: string;
  timestamp: string;
  position: { x: number; y: number };
  clusterId?: number;
  upvotes?: number;
  comments?: number;
  team?: string;
  collaborators?: string[];
  crossTeamOverlap?: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

type ViewMode = 'individual' | 'workshop-wide';
type TeamFilter = 'Mine' | 'Team A' | 'Team B' | 'All Teams';

const agendaItems: AgendaItem[] = [
  { id: '1', title: 'Current State', description: 'Map existing workflow', isActive: false },
  { id: '2', title: 'Pain Points', description: 'Identify bottlenecks & inefficiencies', isActive: true },
  { id: '3', title: 'AI Opportunities', description: 'Explore automation potential', isActive: false },
  { id: '4', title: 'Viability', description: 'Assess implementation readiness', isActive: false },
];

const participants = [
  { name: 'Dr. Sarah Chen', role: 'Clinical Lead', presence: 'In-room', color: 'bg-green-500', initials: 'SC', isMe: true },
  { name: 'Michael Torres', role: 'Ops Director', presence: 'Remote', color: 'bg-blue-500', initials: 'MT', isMe: false },
  { name: 'Jamie Liu', role: 'Data Analyst', presence: 'Remote', color: 'bg-purple-500', initials: 'JL', isMe: false },
];

const breakoutTeams = [
  {
    name: 'Team A',
    members: ['Dr. Sarah Chen', 'Jamie Liu'],
    activeCount: 2
  },
  {
    name: 'Team B',
    members: ['Michael Torres'],
    activeCount: 1
  }
];

// My cards only (Dr. Sarah Chen)
const myUsecaseCards: UsecaseCard[] = [
  {
    id: '1',
    title: 'Intake form duplication',
    summary: 'Multiple manual re-entry points across EHR systems',
    value: 'High',
    viability: 'Medium',
    visibility: 'Internal',
    addedBy: 'Dr. Sarah Chen',
    timestamp: '2m ago',
    position: { x: 80, y: 60 },
    clusterId: 1,
    upvotes: 3,
    comments: 2,
    team: 'Team A',
    collaborators: ['Dr. Sarah Chen', 'Jamie Liu'],
    crossTeamOverlap: 'Team B',
  },
  {
    id: '4',
    title: 'Insurance verification lag',
    summary: 'Manual insurance checks delay intake by 24-48 hours',
    value: 'Medium',
    viability: 'High',
    visibility: 'Internal',
    addedBy: 'Dr. Sarah Chen',
    timestamp: '15m ago',
    position: { x: 420, y: 80 },
    clusterId: 2,
    upvotes: 5,
    comments: 1,
    team: 'Team A',
    collaborators: ['Dr. Sarah Chen'],
  },
];

// All participants' cards for workshop-wide view (more spread out)
const allWorkshopCards: UsecaseCard[] = [
  // Cluster 1 – Integration Issues (teal cluster)
  {
    id: 'w1',
    title: 'Intake form duplication',
    summary: 'Multiple manual re-entry points across EHR systems',
    value: 'High',
    viability: 'Medium',
    visibility: 'Internal',
    addedBy: 'Dr. Sarah Chen',
    timestamp: '2m ago',
    position: { x: 60, y: 70 },
    clusterId: 1,
    upvotes: 3,
    comments: 2,
    team: 'Team A',
    collaborators: ['Dr. Sarah Chen', 'Jamie Liu'],
    crossTeamOverlap: 'Team B',
  },
  {
    id: 'w2',
    title: 'EHR data sync delays',
    summary: 'Patient data not syncing in real-time between systems',
    value: 'High',
    viability: 'Medium',
    visibility: 'Cross-Silo',
    addedBy: 'Michael Torres',
    timestamp: '5m ago',
    position: { x: 290, y: 60 },
    clusterId: 1,
    upvotes: 7,
    comments: 3,
    team: 'Team B',
    collaborators: ['Michael Torres'],
  },
  {
    id: 'w3',
    title: 'Duplicate patient records',
    summary: 'Cross-system duplicates causing clinical confusion and delays',
    value: 'High',
    viability: 'Low',
    visibility: 'Cross-Silo',
    addedBy: 'Jamie Liu',
    timestamp: '18m ago',
    position: { x: 170, y: 190 },
    clusterId: 1,
    upvotes: 4,
    comments: 1,
    team: 'Team A',
    collaborators: ['Jamie Liu'],
  },
  // Cluster 2 – Documentation Automation (sage cluster)
  {
    id: 'w4',
    title: 'Manual fax processing',
    summary: 'Prior auth requests require manual fax review',
    value: 'Medium',
    viability: 'High',
    visibility: 'Internal',
    addedBy: 'Jamie Liu',
    timestamp: '12m ago',
    position: { x: 600, y: 70 },
    clusterId: 2,
    upvotes: 8,
    comments: 2,
    team: 'Team A',
    collaborators: ['Jamie Liu'],
  },
  {
    id: 'w5',
    title: 'Insurance verification lag',
    summary: 'Manual insurance checks delay intake by 24-48 hours',
    value: 'Medium',
    viability: 'High',
    visibility: 'Internal',
    addedBy: 'Dr. Sarah Chen',
    timestamp: '15m ago',
    position: { x: 820, y: 70 },
    clusterId: 2,
    upvotes: 5,
    comments: 1,
    team: 'Team A',
    collaborators: ['Dr. Sarah Chen'],
  },
  {
    id: 'w6',
    title: 'Referral letter generation',
    summary: 'Physicians spending 20 min per referral on paperwork',
    value: 'Medium',
    viability: 'High',
    visibility: 'Internal',
    addedBy: 'Michael Torres',
    timestamp: '22m ago',
    position: { x: 700, y: 200 },
    clusterId: 2,
    upvotes: 6,
    comments: 4,
    team: 'Team B',
    collaborators: ['Michael Torres'],
  },
  // Cluster 3 – Care Coordination (blue cluster)
  {
    id: 'w7',
    title: 'Scheduling conflicts',
    summary: 'No real-time visibility across department schedules',
    value: 'Medium',
    viability: 'High',
    visibility: 'Internal',
    addedBy: 'Michael Torres',
    timestamp: '8m ago',
    position: { x: 80, y: 420 },
    clusterId: 3,
    upvotes: 2,
    comments: 0,
    team: 'Team B',
    collaborators: ['Michael Torres'],
  },
  {
    id: 'w8',
    title: 'Care coordination gaps',
    summary: 'Post-discharge follow-up falls through the cracks',
    value: 'High',
    viability: 'Medium',
    visibility: 'Cross-Silo',
    addedBy: 'Jamie Liu',
    timestamp: '25m ago',
    position: { x: 310, y: 400 },
    clusterId: 3,
    upvotes: 9,
    comments: 3,
    team: 'Team A',
    collaborators: ['Jamie Liu'],
  },
  {
    id: 'w9',
    title: 'Fragmented care notes',
    summary: 'Clinical notes scattered across 3 separate platforms',
    value: 'High',
    viability: 'Medium',
    visibility: 'Restricted',
    addedBy: 'Dr. Sarah Chen',
    timestamp: '30m ago',
    position: { x: 190, y: 540 },
    clusterId: 3,
    upvotes: 4,
    comments: 2,
    team: 'Team A',
    collaborators: ['Dr. Sarah Chen', 'Jamie Liu'],
  },
];

// Cluster definitions for workshop-wide view
const workshopClusters = [
  {
    id: 1,
    label: 'Integration Issues',
    count: 3,
    color: 'rgba(107, 150, 149, 0.08)',
    borderColor: 'rgba(107, 150, 149, 0.3)',
    labelColor: '#6B9695',
    rect: { x: 30, y: 30, w: 540, h: 290 },
  },
  {
    id: 2,
    label: 'Documentation Automation',
    count: 3,
    color: 'rgba(99, 179, 135, 0.08)',
    borderColor: 'rgba(99, 179, 135, 0.3)',
    labelColor: '#38A169',
    rect: { x: 565, y: 30, w: 390, h: 290 },
  },
  {
    id: 3,
    label: 'Care Coordination',
    count: 3,
    color: 'rgba(99, 122, 179, 0.08)',
    borderColor: 'rgba(99, 122, 179, 0.3)',
    labelColor: '#5A6FBA',
    rect: { x: 30, y: 360, w: 540, h: 250 },
  },
];

// Overlap connections for workshop-wide view
const overlapConnections = [
  { from: { x: 230, y: 175 }, to: { x: 735, y: 175 }, label: '78% similar', theme: 'data flow' },
  { from: { x: 230, y: 175 }, to: { x: 245, y: 460 }, label: '65% overlap', theme: 'coordination' },
  { from: { x: 735, y: 175 }, to: { x: 405, y: 460 }, label: '71% overlap', theme: 'manual work' },
];

const getValueColor = (level: string) => {
  switch (level) {
    case 'High': return 'bg-red-50 text-red-700 border-red-200';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low': return 'bg-gray-50 text-gray-600 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getViabilityColor = (level: string) => {
  switch (level) {
    case 'High': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Low': return 'bg-gray-50 text-gray-600 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getVisibilityColor = (visibility: string) => {
  switch (visibility) {
    case 'Internal': return 'bg-gray-50 text-gray-600 border-gray-200';
    case 'Restricted': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Cross-Silo': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'live': return 'bg-[#D1FAE5] text-[#065F46]';
    case 'upcoming': return 'bg-blue-50 text-blue-700';
    case 'completed': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getParticipantColor = (name: string) => {
  if (name.includes('Sarah') || name.includes('Chen')) return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', border: 'border-green-200' };
  if (name.includes('Michael') || name.includes('Torres')) return { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-200' };
  if (name.includes('Jamie') || name.includes('Liu')) return { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50', border: 'border-purple-200' };
  return { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-50', border: 'border-gray-200' };
};

export function WorkshopLive({ onBackToDashboard, onCompleteWorkshop }: WorkshopLiveProps) {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isAiCollapsed, setIsAiCollapsed] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(['Clinical Ops', 'Care Coordination']);
  const [expandedAgenda, setExpandedAgenda] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [cards, setCards] = useState<UsecaseCard[]>(myUsecaseCards);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isAiFocusMode, setIsAiFocusMode] = useState(false);
  const [isUsecaseListOpen, setIsUsecaseListOpen] = useState(false);
  const [usecaseSearchQuery, setUsecaseSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('Mine');

  // ── Workshop-wide view state ──────────────────────────────────────────────
  const [workshopCards, setWorkshopCards] = useState<UsecaseCard[]>(allWorkshopCards);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [clusterRects, setClusterRects] = useState<Record<number, { x: number; y: number; w: number; h: number }>>({
    1: { x: 30, y: 30, w: 540, h: 290 },
    2: { x: 565, y: 30, w: 390, h: 290 },
    3: { x: 30, y: 360, w: 540, h: 250 },
  });

  // Individual card drag in workshop view
  const [workshopCardDrag, setWorkshopCardDrag] = useState<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Cluster group drag in workshop view
  const [workshopClusterDrag, setWorkshopClusterDrag] = useState<{
    clusterId: number;
    startMouseX: number;
    startMouseY: number;
    origCardPositions: Record<string, { x: number; y: number }>;
    origClusterRect: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const moveCard = (id: string, left: number, top: number) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, position: { x: left, y: top } } : card
      )
    );
  };

  const handleUpvote = (id: string) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, upvotes: (card.upvotes || 0) + 1 } : card
      )
    );
  };

  const handleComment = (id: string) => {
    console.log('Open comment modal for card:', id);
    // Implement comment modal later
  };

  const handleOpenAIChat = (id: string) => {
    console.log('Open AI chat for card:', id);
    setIsAiFocusMode(true);
    setIsAiCollapsed(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleAddUsecaseClick = () => {
    setIsAiFocusMode(true);
    setIsAiCollapsed(false);
  };

  const handleConfirmUsecase = () => {
    setIsAiFocusMode(false);
    setIsUsecaseListOpen(false);
  };

  // ── Workshop-wide drag & filter handlers ─────────────────────────────────

  const handleClusterLabelClick = (e: React.MouseEvent, clusterId: number) => {
    e.stopPropagation();
    setSelectedCluster(prev => prev === clusterId ? null : clusterId);
  };

  const handleClusterDragStart = (e: React.MouseEvent, clusterId: number) => {
    e.stopPropagation();
    const origCardPositions: Record<string, { x: number; y: number }> = {};
    workshopCards.forEach(c => { origCardPositions[c.id] = { ...c.position }; });
    setWorkshopClusterDrag({
      clusterId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origCardPositions,
      origClusterRect: { ...clusterRects[clusterId] },
    });
  };

  const handleWorkshopCardDragStart = (e: React.MouseEvent, card: UsecaseCard) => {
    e.stopPropagation();
    setWorkshopCardDrag({
      id: card.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origX: card.position.x,
      origY: card.position.y,
    });
  };

  const handleWorkshopMouseMove = (e: React.MouseEvent) => {
    if (workshopCardDrag) {
      const dx = (e.clientX - workshopCardDrag.startMouseX) / zoom;
      const dy = (e.clientY - workshopCardDrag.startMouseY) / zoom;
      setWorkshopCards(prev =>
        prev.map(c =>
          c.id === workshopCardDrag.id
            ? { ...c, position: { x: workshopCardDrag.origX + dx, y: workshopCardDrag.origY + dy } }
            : c
        )
      );
    } else if (workshopClusterDrag) {
      const dx = (e.clientX - workshopClusterDrag.startMouseX) / zoom;
      const dy = (e.clientY - workshopClusterDrag.startMouseY) / zoom;
      setWorkshopCards(prev =>
        prev.map(c => {
          const orig = workshopClusterDrag.origCardPositions[c.id];
          if (orig && c.clusterId === workshopClusterDrag.clusterId) {
            return { ...c, position: { x: orig.x + dx, y: orig.y + dy } };
          }
          return c;
        })
      );
      const orig = workshopClusterDrag.origClusterRect;
      setClusterRects(prev => ({
        ...prev,
        [workshopClusterDrag.clusterId]: { ...orig, x: orig.x + dx, y: orig.y + dy },
      }));
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleWorkshopMouseUp = () => {
    setWorkshopCardDrag(null);
    setWorkshopClusterDrag(null);
    setIsPanning(false);
  };

  const handleWorkshopCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleViewModeSwitch = (mode: ViewMode) => {
    setViewMode(mode);
    // Reset zoom/pan when switching views
    if (mode === 'workshop-wide') {
      setZoom(0.65);
      setPan({ x: 20, y: 20 });
      setTeamFilter('All Teams');
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setTeamFilter('Mine');
    }
    setIsAiFocusMode(false);
  };

  const handleTeamFilterChange = (filter: TeamFilter) => {
    setTeamFilter(filter);
  };

  // Render AI Analyst right panel content
  const renderAIAnalystPanel = () => {
    // Determine workspace context based on team filter
    const workspaceContext = teamFilter === 'Mine' ? 'your workspace' : 
                            teamFilter === 'All Teams' ? 'all workspaces' : 
                            `${teamFilter} workspace`;
    
    return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#6B9695]" />
            <h3
              className="text-[14px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              AI Analyst
            </h3>
          </div>
          <p
            className="text-[11px] text-gray-500"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            Analyzing {workspaceContext}...
          </p>
        </div>
        <button
          onClick={() => setIsAiCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
            <p
              className="text-[13px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              We're seeing duplicate intake entries between Epic and the referral system.
            </p>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
            <p
              className="text-[13px] text-gray-900 mb-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Would you classify this as operational inefficiency or system integration gap?
            </p>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
            <p
              className="text-[13px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              System integration gap
            </p>
          </div>
        </div>

        {/* AI Structured Preview */}
        <div className="flex justify-start">
          <div className="bg-white border-2 border-[#6B9695] rounded-xl px-4 py-3 w-full">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#6B9695]" />
              <span
                className="text-[11px] text-[#6B9695]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                STRUCTURED PREVIEW
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <p
                  className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Title
                </p>
                <p
                  className="text-[13px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Intake Form Duplication
                </p>
              </div>

              <div>
                <p
                  className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Summary
                </p>
                <p
                  className="text-[12px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Manual re-entry across EHR systems
                </p>
              </div>

              <div className="flex gap-2">
                <div>
                  <p
                    className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Value
                  </p>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border bg-red-50 text-red-700 border-red-200"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    High
                  </span>
                </div>
                <div>
                  <p
                    className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Viability
                  </p>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border bg-blue-50 text-blue-700 border-blue-200"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Medium
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p
                  className="text-[11px] text-gray-600"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Similarity: <span className="text-[#6B9695] font-semibold">87%</span> to "EHR Data Sync Delays"
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[12px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Create Usecase Card
              </button>
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[12px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Refine
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Describe a usecase..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            className="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
  };

  // ── VIEW TOGGLE BUTTON ──────────────────────────────────────────────────────
  const ViewToggle = () => (
    <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
      {/* Main View Toggle */}
      <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm p-0.5">
        <button
          onClick={() => handleViewModeSwitch('individual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-all ${
            viewMode === 'individual'
              ? 'bg-[#6B9695] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          title="My individual view"
        >
          <User className="w-3.5 h-3.5" />
          My View
        </button>
        <button
          onClick={() => handleViewModeSwitch('workshop-wide')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-all ${
            viewMode === 'workshop-wide'
              ? 'bg-[#6B9695] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          title="Workshop-wide overview"
        >
          <Users className="w-3.5 h-3.5" />
          Workshop View
        </button>
      </div>

      {/* Unified Team Filter Dropdown (only in individual view) */}
      {viewMode === 'individual' && (
        <div className="relative">
          <label className="flex items-center gap-2 bg-[#F5F5F5] border border-gray-200 rounded-lg shadow-sm px-3 py-1.5">
            <span className="text-[11px] text-gray-600" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              View:
            </span>
            <select
              value={teamFilter}
              onChange={(e) => handleTeamFilterChange(e.target.value as TeamFilter)}
              className="bg-transparent text-[12px] text-gray-700 font-medium cursor-pointer focus:outline-none appearance-none pr-5"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <option value="Mine">Mine</option>
              <option value="Team A">Team A</option>
              <option value="Team B">Team B</option>
              <option value="All Teams">All Teams</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </label>
        </div>
      )}
    </div>
  );

  // ── INDIVIDUAL CANVAS (My View) ─────────────────────────────────────────────
  const renderIndividualCanvas = () => (
    <div
      ref={canvasRef}
      className="flex-1 relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 bg-[#FAFAF9]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {/* View Toggle */}
        <ViewToggle />

        {/* Workspace Header */}
        {teamFilter !== 'All Teams' && (
          <div className="absolute top-[68px] left-6 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 max-w-2xl">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2
                  className="text-[14px] text-gray-900 mb-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  {teamFilter === 'Mine' ? 'My Workspace' : `${teamFilter} Workspace`}
                </h2>
                <p
                  className="text-[11px] text-gray-600"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  {teamFilter === 'Team A' ? 'Active collaborators: Sarah, Jamie' : 
                   teamFilter === 'Team B' ? 'Active collaborators: Michael' : 
                   'Your personal workspace'}
                </p>
              </div>
              <button
                onClick={handleAddUsecaseClick}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg shadow-sm transition-colors text-[12px] whitespace-nowrap"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Use Case
              </button>
            </div>
          </div>
        )}

        {/* Zoomable/Pannable Workspace */}
        <div
          className="absolute inset-0 p-6 pt-28"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {(() => {
            // Determine which cards to show based on team filter
            let cardsToShow: UsecaseCard[] = [];
            if (teamFilter === 'Mine') {
              cardsToShow = myUsecaseCards;
            } else if (teamFilter === 'All Teams') {
              cardsToShow = allWorkshopCards;
            } else {
              // Team A or Team B
              cardsToShow = allWorkshopCards.filter((card) => card.team === teamFilter);
            }
            
            return cardsToShow.map((card) => (
              <DraggableUsecaseCard 
                key={card.id} 
                card={card} 
                onMove={moveCard}
                onUpvote={handleUpvote}
                onComment={handleComment}
                onOpenAIChat={handleOpenAIChat}
              />
            ));
          })()}

          {/* Cluster Connection */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <line
              x1="216" y1="160"
              x2="556" y2="180"
              stroke="#6B9695"
              strokeWidth="2"
              strokeOpacity="0.15"
              strokeDasharray="4 4"
            />
          </svg>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
          <div className="px-2 text-[11px] text-gray-600 font-medium min-w-[50px] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── WORKSHOP-WIDE CANVAS ────────────────────────────────────────────────────
  const renderWorkshopWideCanvas = () => {
    const isCardDragging = workshopCardDrag !== null;
    const isClusterDragging = workshopClusterDrag !== null;
    const activeDragCursor = (isCardDragging || isClusterDragging) ? 'grabbing' : isPanning ? 'grabbing' : 'grab';

    return (
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden select-none"
        onMouseDown={handleWorkshopCanvasMouseDown}
        onMouseMove={handleWorkshopMouseMove}
        onMouseUp={handleWorkshopMouseUp}
        onMouseLeave={handleWorkshopMouseUp}
        style={{ cursor: activeDragCursor }}
      >
        {/* Background Grid */}
        <div
          className="absolute inset-0"
          style={{
            background: '#F4F6F8',
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.025) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        >
          {/* View Toggle */}
          <ViewToggle />

          {/* Presentation mode banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1E2A38] text-white rounded-lg shadow-md">
              <Users className="w-4 h-4 text-[#6B9695]" />
              <span className="text-[12px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Workshop Overview — Oncology Intake Redesign
              </span>
              <span className="text-[11px] text-gray-400 ml-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                3 participants · 9 usecases · 3 themes
              </span>
            </div>
            {/* Active filter indicator */}
            {selectedCluster !== null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-md">
                <span className="text-[11px] text-gray-600" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  Filtered:
                </span>
                <span
                  className="text-[11px]"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    color: workshopClusters.find(c => c.id === selectedCluster)?.labelColor,
                  }}
                >
                  {workshopClusters.find(c => c.id === selectedCluster)?.label}
                </span>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                  title="Clear filter"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {/* Complete Workshop Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onCompleteWorkshop}
              className="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg shadow-sm transition-colors text-[12px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              title="Complete Workshop"
            >
              Complete Workshop
            </button>
          </div>

          {/* Participant Legend */}
          <div className="absolute top-16 right-4 z-20 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              Participants
            </p>
            {participants.map((p) => {
              const colors = getParticipantColor(p.name);
              return (
                <div key={p.name} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                  <span className="text-[11px] text-gray-700" style={{ fontFamily: 'Inter, sans-serif', fontWeight: p.isMe ? 600 : 400 }}>
                    {p.name}{p.isMe ? ' (you)' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Zoomable/Pannable Workspace */}
          <div
            className="absolute inset-0 pt-20 px-6 pb-6"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: (isCardDragging || isClusterDragging || isPanning) ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Cluster Background Regions */}
            {workshopClusters.map((cluster) => {
              const rect = clusterRects[cluster.id];
              const isActive = selectedCluster === cluster.id;
              const isDimmed = selectedCluster !== null && !isActive;
              const isThisClusterDragging = workshopClusterDrag?.clusterId === cluster.id;

              return (
                <div
                  key={cluster.id}
                  className="absolute rounded-2xl transition-all duration-200"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.w,
                    height: rect.h,
                    background: isActive
                      ? cluster.color.replace('0.08', '0.14')
                      : isDimmed
                        ? 'rgba(0,0,0,0.015)'
                        : cluster.color,
                    border: isActive
                      ? `2px solid ${cluster.borderColor.replace('0.3', '0.7')}`
                      : isDimmed
                        ? '1.5px dashed rgba(0,0,0,0.06)'
                        : `1.5px dashed ${cluster.borderColor}`,
                    boxShadow: isActive ? `0 0 0 3px ${cluster.borderColor.replace('0.3', '0.12')}` : 'none',
                    opacity: isDimmed ? 0.4 : 1,
                    zIndex: isThisClusterDragging ? 5 : 0,
                  }}
                >
                  {/* Cluster Header Row */}
                  <div className="absolute -top-5 left-3 flex items-center gap-1.5">
                    {/* Drag Handle */}
                    <div
                      onMouseDown={(e) => handleClusterDragStart(e, cluster.id)}
                      className="flex items-center justify-center w-5 h-5 rounded cursor-grab active:cursor-grabbing hover:bg-white/80 transition-colors"
                      title="Drag to move entire cluster"
                      style={{ opacity: isDimmed ? 0.3 : 1 }}
                    >
                      <GripVertical className="w-3.5 h-3.5" style={{ color: cluster.labelColor }} />
                    </div>

                    {/* Filter Label Button */}
                    <button
                      onClick={(e) => handleClusterLabelClick(e, cluster.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all duration-150"
                      style={{
                        background: isActive ? cluster.labelColor : 'white',
                        color: isActive ? 'white' : cluster.labelColor,
                        border: `1.5px solid ${isActive ? cluster.labelColor : cluster.borderColor}`,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        boxShadow: isActive ? `0 2px 8px ${cluster.borderColor.replace('0.3', '0.35')}` : '0 1px 3px rgba(0,0,0,0.08)',
                        opacity: isDimmed ? 0.4 : 1,
                      }}
                      title={isActive ? 'Click to clear filter' : 'Click to filter this cluster'}
                    >
                      {cluster.label}
                      <span
                        className="text-[9px] ml-0.5 px-1 rounded-full"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.25)' : cluster.color,
                          color: isActive ? 'white' : cluster.labelColor,
                        }}
                      >
                        {cluster.count}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Overlap Connection Lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 1, width: '1200px', height: '800px' }}
            >
              {overlapConnections.map((conn, i) => {
                const dimmed = selectedCluster !== null;
                return (
                  <g key={i} style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.2s' }}>
                    <line
                      x1={conn.from.x} y1={conn.from.y}
                      x2={conn.to.x} y2={conn.to.y}
                      stroke="#C4A8D4"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                      strokeDasharray="6 4"
                    />
                    <foreignObject
                      x={(conn.from.x + conn.to.x) / 2 - 36}
                      y={(conn.from.y + conn.to.y) / 2 - 12}
                      width="72"
                      height="24"
                    >
                      <div style={{
                        background: 'white',
                        border: '1px solid #C4A8D4',
                        borderRadius: '99px',
                        padding: '1px 6px',
                        fontSize: '10px',
                        color: '#7B5EA7',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}>
                        {conn.label}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>

            {/* Workshop-Wide Usecase Cards */}
            {workshopCards.map((card) => {
              const colors = getParticipantColor(card.addedBy);
              const isMe = card.addedBy.includes('Sarah') || card.addedBy.includes('Chen');
              const isInActiveCluster = selectedCluster === null || card.clusterId === selectedCluster;
              const isDimmedCard = selectedCluster !== null && !isInActiveCluster;
              const isThisCardDragging = workshopCardDrag?.id === card.id;
              const isInDraggingCluster = workshopClusterDrag?.clusterId === card.clusterId;

              return (
                <div
                  key={card.id}
                  className="absolute bg-white rounded-xl border p-3 group"
                  onMouseDown={(e) => handleWorkshopCardDragStart(e, card)}
                  style={{
                    left: `${card.position.x}px`,
                    top: `${card.position.y}px`,
                    width: '230px',
                    borderColor: isMe ? 'rgba(107, 150, 149, 0.4)' : 'rgba(0,0,0,0.08)',
                    boxShadow: isThisCardDragging
                      ? '0 8px 24px rgba(0,0,0,0.18), 0 0 0 2px rgba(107,150,149,0.3)'
                      : isMe
                        ? '0 2px 12px rgba(107, 150, 149, 0.15), 0 0 0 1.5px rgba(107, 150, 149, 0.15)'
                        : '0 2px 8px rgba(0,0,0,0.06)',
                    opacity: isDimmedCard ? 0.18 : 1,
                    zIndex: isThisCardDragging || isInDraggingCluster ? 20 : isInActiveCluster ? 2 : 1,
                    cursor: isThisCardDragging ? 'grabbing' : 'grab',
                    transform: isThisCardDragging ? 'scale(1.03)' : 'scale(1)',
                    transition: isThisCardDragging ? 'box-shadow 0.1s, transform 0.1s' : 'opacity 0.2s, box-shadow 0.1s, transform 0.1s',
                    filter: isDimmedCard ? 'grayscale(0.6)' : 'none',
                  }}
                >
                  {/* Creator badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] border mb-2 ${colors.light} ${colors.text} ${colors.border}`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                    {card.addedBy}{isMe ? ' (you)' : ''}
                  </div>

                  <h4 className="text-[12px] text-gray-900 mb-1" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                    {card.summary}
                  </p>

                  {/* Team badge */}
                  {card.team && (
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      {card.team}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] border ${getValueColor(card.value)}`}
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      Value: {card.value}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] border ${getViabilityColor(card.viability)}`}
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      Viability: {card.viability}
                    </span>
                  </div>

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mb-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-[9px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        title="Upvote"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                        {card.upvotes || 0}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-[9px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        title="Comment"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        {card.comments || 0}
                      </button>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-[#F0F9F9] text-[#6B9695] transition-colors text-[9px]"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      title="Continue with AI"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="mt-1.5 text-[9px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {card.timestamp}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Zoom out">
              <ZoomOut className="w-4 h-4 text-gray-700" />
            </button>
            <div className="px-2 text-[11px] text-gray-600 font-medium min-w-[50px] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Zoom in">
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-[#FAFAF9]\">\n        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden\">

          {/* CONTEXT PANEL - visible only in individual view */}
          {viewMode === 'individual' && (
            <div className="w-72 flex-shrink-0 bg-[#FAFAF9] border-r border-gray-200 flex flex-col">
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex-1">
                  <h2
                    className="text-[15px] text-gray-900 mb-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Oncology Intake Redesign
                  </h2>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#D1FAE5] text-[#065F46]"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>
                {/* Complete Workshop button */}
                <button
                  onClick={onCompleteWorkshop}
                  className="ml-2 px-3 py-1.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[11px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  title="Complete Workshop"
                >
                  Complete
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Agenda Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setExpandedAgenda(!expandedAgenda)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-t-xl transition-colors"
                  >
                    <span
                      className="text-[13px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Agenda
                    </span>
                    {expandedAgenda ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </button>

                  {expandedAgenda && (
                    <div className="px-2 pb-3 space-y-1">
                      {agendaItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                            item.isActive ? 'bg-[#F0F9F9]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                            item.isActive ? 'bg-[#10B981] shadow-sm shadow-[#10B981]/50 animate-pulse' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1">
                            <p
                              className={`text-[13px] ${item.isActive ? 'text-gray-900' : 'text-gray-700'}`}
                              style={{ fontFamily: 'Inter, sans-serif', fontWeight: item.isActive ? 500 : 400 }}
                            >
                              {item.title}
                            </p>
                            <p
                              className="text-[11px] text-gray-500 mt-0.5"
                              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Participants Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3
                      className="text-[13px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Participants
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full ${participant.color}`} />
                        <div className="flex-1">
                          <p
                            className="text-[13px] text-gray-900"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: participant.isMe ? 600 : 500 }}
                          >
                            {participant.name}{participant.isMe ? ' (you)' : ''}
                          </p>
                          <p
                            className="text-[11px] text-gray-500"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                          >
                            {participant.role} · {participant.presence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakout Teams Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3
                      className="text-[13px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Breakout Teams
                    </h3>
                  </div>
                  <div className="p-2 space-y-2">
                    {breakoutTeams.map((team, index) => (
                      <div key={index} className="px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <p
                          className="text-[12px] text-indigo-700 mb-1.5"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          {team.name}
                        </p>
                        <div className="space-y-1 mb-2">
                          {team.members.map((member, idx) => {
                            const participant = participants.find(p => p.name === member);
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${participant?.color || 'bg-gray-400'}`} />
                                <p
                                  className="text-[11px] text-gray-700"
                                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                                >
                                  {member}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span
                            className="text-[10px] text-gray-600"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            {team.activeCount} Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-200">
                <button
                  onClick={onBackToDashboard}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <X className="w-4 h-4" />
                  Exit Workshop
                </button>
              </div>
            </div>
          )}

          {/* CENTER - Canvas */}
          {viewMode === 'workshop-wide' ? (
            renderWorkshopWideCanvas()
          ) : !isAiFocusMode ? (
            renderIndividualCanvas()
          ) : (
            <AIAnalystCenter onConfirm={handleConfirmUsecase} />
          )}

          {/* RIGHT PANEL - AI Analyst (only in individual view) */}
          {viewMode === 'individual' && (
            !isAiFocusMode ? (
              <div
                className={`bg-white border-l border-gray-200 flex-shrink-0 transition-all duration-300 ${
                  isAiCollapsed ? 'w-16' : 'w-96'
                }`}
              >
                {isAiCollapsed ? (
                  <div className="h-full flex flex-col items-center py-4 gap-4">
                    <button
                      onClick={() => setIsAiCollapsed(false)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      title="Open AI Analyst"
                    >
                      <Sparkles className="w-5 h-5 text-[#6B9695]" />
                    </button>
                    <div
                      className="text-[11px] text-gray-500 [writing-mode:vertical-lr] rotate-180"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      AI ANALYST
                    </div>
                  </div>
                ) : (
                  renderAIAnalystPanel()
                )}
              </div>
            ) : (
              <div className="w-16 bg-white border-l border-gray-200 flex-shrink-0 relative">
                <div className="h-full flex flex-col items-center py-4">
                  <button
                    onClick={() => setIsUsecaseListOpen(!isUsecaseListOpen)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="View usecases"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div
                    className="text-[11px] text-gray-500 [writing-mode:vertical-lr] rotate-180 mt-4"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    USECASES
                  </div>
                </div>

                {isUsecaseListOpen && (
                  <UsecaseListPopup
                    cards={cards}
                    searchQuery={usecaseSearchQuery}
                    onSearchChange={setUsecaseSearchQuery}
                    onClose={() => setIsUsecaseListOpen(false)}
                  />
                )}
              </div>
            )
          )}
        </div>

        {/* BOTTOM BAR */}
        {viewMode === 'individual' ? (
          // Individual view bottom bar — insights & suggestions
          <div className="h-32 bg-white border-t-2 border-gray-200 flex-shrink-0 overflow-hidden">
            <div className="h-full px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-[12px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  AI Insights & Patterns
                </h3>
                <span
                  className="text-[10px] text-gray-500"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Based on your 2 usecases
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <div className="flex-shrink-0 w-72 bg-gradient-to-br from-[#F0F9F9] to-white border border-[#6B9695]/30 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#6B9695]/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-[#6B9695]" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-[12px] text-gray-900 mb-0.5"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        Suggested Theme
                      </h4>
                      <p
                        className="text-[11px] text-gray-600"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Intake Workflow Optimization — Your usecases clustered together
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-72 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 text-[10px] font-bold">87%</span>
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-[12px] text-gray-900 mb-0.5"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        Overlap Detected
                      </h4>
                      <p
                        className="text-[11px] text-gray-600"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Similar to Michael's "EHR Data Sync Delays"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-72 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-[12px] text-gray-900 mb-0.5"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        Cross-Workshop Pattern
                      </h4>
                      <p
                        className="text-[11px] text-gray-600"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Similar theme in Cardiology Workshop: "Manual Intake Bottlenecks"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Workshop-wide bottom bar — aggregate insights
          <div className="h-32 bg-[#1E2A38] border-t-2 border-[#2D3E50] flex-shrink-0 overflow-hidden">
            <div className="h-full px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-[12px] text-white"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Workshop Analytics
                </h3>
                <span
                  className="text-[10px] text-gray-400"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Real-time synthesis
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {/* Stats Summary */}
                <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 bg-[#253342] rounded-lg border border-[#2D3E50]">
                  <div className="text-center px-3 border-r border-[#2D3E50]">
                    <p
                      className="text-[20px] text-white leading-none mb-1"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      9
                    </p>
                    <p
                      className="text-[9px] text-[#6B9695] uppercase tracking-wide"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Usecases
                    </p>
                  </div>
                  <div className="text-center px-3 border-r border-[#2D3E50]">
                    <p
                      className="text-[20px] text-white leading-none mb-1"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      3
                    </p>
                    <p
                      className="text-[9px] text-[#6B9695] uppercase tracking-wide"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Themes
                    </p>
                  </div>
                  <div className="text-center px-3 border-r border-[#2D3E50]">
                    <p
                      className="text-[20px] text-white leading-none mb-1"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      3
                    </p>
                    <p
                      className="text-[9px] text-[#6B9695] uppercase tracking-wide"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Overlaps
                    </p>
                  </div>
                  <div className="text-center px-3">
                    <p
                      className="text-[20px] text-[#10B981] leading-none mb-1"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      High
                    </p>
                    <p
                      className="text-[9px] text-[#6B9695] uppercase tracking-wide"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      Avg Impact
                    </p>
                  </div>
                </div>

                {/* Top Theme */}
                <div className="flex-shrink-0 w-60 bg-[#253342] border border-[#3A8A87]/40 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#6B9695]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#6B9695] text-[10px] font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-[12px] text-white mb-0.5"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        Top Theme: Integration Issues
                      </h4>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        3 usecases · All participants contributed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Overlap */}
                <div className="flex-shrink-0 w-60 bg-[#253342] border border-purple-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-[10px] font-bold">78%</span>
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-[12px] text-white mb-0.5"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        Strongest Overlap
                      </h4>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        EHR sync + Intake duplication — merge candidate
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Win */}
                <div className="flex-shrink-0 w-60 bg-[#253342] border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-[12px] text-white mb-0.5"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        Quick Win Identified
                      </h4>
                      <p
                        className="text-[10px] text-gray-400"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Documentation Automation · 3 high-feasibility usecases
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
