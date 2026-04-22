<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { UseCase, BreakoutTeam, Participant, WorkshopEvent } from '$lib/workshop/types';

  let { data }: { data: PageData } = $props();

  const workshopId = $derived($page.params.workshopId);

  type ViewMode = 'individual' | 'workshop-wide';
  type TeamFilter = 'Mine' | 'Team A' | 'Team B' | 'All Teams';

  let viewMode = $state<ViewMode>('individual');
  let teamFilter = $state<TeamFilter>('Mine');
  let isAiCollapsed = $state(false);
  let isNavCollapsed = $state(false);
  let zoom = $state(1);
  let aiInput = $state('');
  let aiStreaming = $state(false);
  let selectedCluster = $state<number | null>(null);
  let contextExpanded = $state(false);
  let painPointsExpanded = $state(false);

  // AI semantic clusters (workshop-wide view)
  interface AiCluster { theme: string; useCaseIds: string[] }
  interface VoronoiRegion {
    id: number; theme: string; count: number; useCaseIds: Set<string>;
    polygon: { x: number; y: number }[];
    centroid: { x: number; y: number };
    color: string; borderColor: string; labelColor: string;
  }
  let aiClusters = $state<AiCluster[]>([]);
  let aiClusterLoading = $state(false);
  let clusteredCardPositions = $state<Record<string, { x: number; y: number }>>({});
  let voronoiRegions = $state<VoronoiRegion[]>([]);

  interface AiMessage {
    role: 'user' | 'assistant';
    content: string;
  }
  interface UsecasePreview {
    title: string;
    summary: string;
    value: 'High' | 'Medium' | 'Low';
    viability: 'High' | 'Medium' | 'Low';
  }

  // ── AI sessions (one per card + one for creation) ────────────────────────────
  type AiSession = { messages: AiMessage[]; preview: UsecasePreview | null };
  const sessionStore: Record<string, AiSession> = {};
  let activeSessionId = $state('new');
  let aiMessages = $state<AiMessage[]>([]);
  let aiPreview = $state<UsecasePreview | null>(null);
  let aiCreationMode = $state(false);

  function saveSession() {
    sessionStore[activeSessionId] = { messages: [...aiMessages], preview: aiPreview };
  }

  // Auto-populate form when AI generates a preview during creation
  $effect(() => {
    if (aiCreationMode && aiPreview) {
      newTitle = aiPreview.title;
      newSummary = aiPreview.summary;
      newValue = aiPreview.value;
      newViability = aiPreview.viability;
    }
  });
  function loadSession(id: string, primeMessage?: string) {
    saveSession();
    activeSessionId = id;
    const saved = sessionStore[id];
    aiMessages = saved ? [...saved.messages] : (primeMessage ? [{ role: 'assistant' as const, content: primeMessage }] : []);
    aiPreview = saved?.preview ?? null;
  }

  // ── AI semantic clustering + Voronoi layout ──────────────────────────────────

  type Pt = { x: number; y: number };

  // Clip a convex polygon to the half-plane: (p - mid) · norm >= 0
  function clipToHalfPlane(poly: Pt[], mid: Pt, norm: Pt): Pt[] {
    if (!poly.length) return [];
    const out: Pt[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = (a.x - mid.x) * norm.x + (a.y - mid.y) * norm.y;
      const db = (b.x - mid.x) * norm.x + (b.y - mid.y) * norm.y;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
      }
    }
    return out;
  }

  // Compute the Voronoi cell polygon for seed[i] within the bounding rect
  function voronoiCell(seeds: Pt[], i: number, W: number, H: number): Pt[] {
    let poly: Pt[] = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
    for (let j = 0; j < seeds.length; j++) {
      if (j === i || !poly.length) continue;
      const mid: Pt = { x: (seeds[i].x + seeds[j].x) / 2, y: (seeds[i].y + seeds[j].y) / 2 };
      const norm: Pt = { x: seeds[i].x - seeds[j].x, y: seeds[i].y - seeds[j].y };
      poly = clipToHalfPlane(poly, mid, norm);
    }
    return poly;
  }

  function polygonCentroid(poly: Pt[]): Pt {
    const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    return { x: cx, y: cy };
  }

  // Predefined seed positions for N clusters on a 1600×900 canvas
  const SEEDS_BY_N: Pt[][] = [
    [],
    [{ x: 800, y: 450 }],
    [{ x: 530, y: 450 }, { x: 1070, y: 450 }],
    [{ x: 400, y: 310 }, { x: 1200, y: 310 }, { x: 800, y: 650 }],
    [{ x: 400, y: 300 }, { x: 1200, y: 300 }, { x: 400, y: 660 }, { x: 1200, y: 660 }],
    [{ x: 320, y: 310 }, { x: 980, y: 310 }, { x: 1340, y: 510 }, { x: 640, y: 650 }, { x: 1160, y: 650 }],
    [{ x: 320, y: 290 }, { x: 800, y: 290 }, { x: 1280, y: 290 }, { x: 320, y: 660 }, { x: 800, y: 660 }, { x: 1280, y: 660 }],
  ];

  const VORONOI_PALETTE = [
    { color: 'rgba(107,150,149,0.10)', borderColor: 'rgba(107,150,149,0.35)', labelColor: '#6B9695' },
    { color: 'rgba(99,179,135,0.10)', borderColor: 'rgba(99,179,135,0.35)', labelColor: '#38A169' },
    { color: 'rgba(99,122,179,0.10)', borderColor: 'rgba(99,122,179,0.35)', labelColor: '#5A6FBA' },
    { color: 'rgba(229,159,60,0.10)', borderColor: 'rgba(229,159,60,0.35)', labelColor: '#B7791F' },
    { color: 'rgba(199,97,97,0.10)', borderColor: 'rgba(199,97,97,0.35)', labelColor: '#C05252' },
    { color: 'rgba(159,122,234,0.10)', borderColor: 'rgba(159,122,234,0.35)', labelColor: '#805AD5' },
  ];

  const CANVAS_W = 1600, CANVAS_H = 900;
  const CARD_W = 256, CARD_H = 240, GAP = 20;

  function computeClusterLayout(clusters: AiCluster[]) {
    const n = clusters.length;
    if (!n) { clusteredCardPositions = {}; voronoiRegions = []; return; }

    const seeds = (SEEDS_BY_N[Math.min(n, 6)] ?? SEEDS_BY_N[6]).slice(0, n);

    const pos: Record<string, { x: number; y: number }> = {};
    const regions: VoronoiRegion[] = [];

    clusters.forEach((cluster, i) => {
      const seed = seeds[i];
      const cardCount = cluster.useCaseIds.length;
      const cols = Math.min(Math.max(1, Math.ceil(Math.sqrt(cardCount))), 3);
      const rows = Math.ceil(cardCount / cols);
      const gridW = cols * CARD_W + (cols - 1) * GAP;
      const gridH = rows * CARD_H + (rows - 1) * GAP;

      cluster.useCaseIds.forEach((id, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        pos[id] = {
          x: seed.x - gridW / 2 + col * (CARD_W + GAP),
          y: seed.y - gridH / 2 + row * (CARD_H + GAP),
        };
      });

      const poly = voronoiCell(seeds, i, CANVAS_W, CANVAS_H);
      regions.push({
        id: i,
        theme: cluster.theme,
        count: cardCount,
        useCaseIds: new Set(cluster.useCaseIds),
        polygon: poly,
        centroid: polygonCentroid(poly),
        ...VORONOI_PALETTE[i % VORONOI_PALETTE.length],
      });
    });

    clusteredCardPositions = pos;
    voronoiRegions = regions;
  }

  async function fetchAiClusters() {
    if (cards.length === 0) return;
    aiClusterLoading = true;
    aiClusters = [];
    clusteredCardPositions = {};
    try {
      const res = await fetch(`/api/workshop/${workshopId}/ai-cluster`, { method: 'POST' });
      if (res.ok) {
        const { clusters } = await res.json() as { clusters: AiCluster[] };
        aiClusters = clusters;
        computeClusterLayout(clusters);
      }
    } catch (err) {
      console.error('cluster error', err);
    } finally {
      aiClusterLoading = false;
    }
  }

  // ── Card selection / edit ──────────────────────────────────────────────────
  let selectedCardId = $state<string | null>(null);
  let editTitle = $state('');
  let editSummary = $state('');
  let editContext = $state('');
  let editValue = $state<'High' | 'Medium' | 'Low'>('High');
  let editViability = $state<'High' | 'Medium' | 'Low'>('Medium');
  let editVisibility = $state<'Internal' | 'Restricted' | 'Cross-Silo'>('Internal');
  let savingEdit = $state(false);

  // Drag vs click detection
  let dragStartPos = { x: 0, y: 0 };
  let didDrag = false;

  // Comment drawer
  interface Comment {
    id: string;
    useCaseId: string;
    participantId: string;
    authorName: string;
    authorInitials: string;
    authorColor: string;
    content: string;
    createdAt: string;
  }
  let commentCardId = $state<string | null>(null);
  let commentList = $state<Comment[]>([]);
  let commentInput = $state('');
  let commentLoading = $state(false);
  let commentPosting = $state(false);

  // Team selection (first visit)
  let joiningTeam = $state(false);

  async function sendAiMessage() {
    const text = aiInput.trim();
    if (!text || aiStreaming) return;
    aiInput = '';
    aiMessages = [...aiMessages, { role: 'user', content: text }];
    aiStreaming = true;
    aiPreview = null;

    let assistantContent = '';
    aiMessages = [...aiMessages, { role: 'assistant', content: '' }];

    try {
      const body: Record<string, unknown> = {
        message: text,
        history: aiMessages.slice(0, -1),
      };
      // Pass useCaseId when in a card-specific session
      if (activeSessionId !== 'new') body.useCaseId = activeSessionId;

      const res = await fetch(`/api/workshop/${workshopId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          const chunk = JSON.parse(payload) as { text: string };
          assistantContent += chunk.text;
          // Update the last message live
          aiMessages = [
            ...aiMessages.slice(0, -1),
            { role: 'assistant', content: assistantContent },
          ];
        }
      }

      // Parse usecase_preview if present
      const previewMatch = assistantContent.match(/<usecase_preview>([\s\S]*?)<\/usecase_preview>/);
      if (previewMatch) {
        try {
          aiPreview = JSON.parse(previewMatch[1].trim()) as UsecasePreview;
        } catch {
          // ignore parse errors
        }
      }
    } catch (err) {
      console.error('AI error', err);
      aiMessages = [
        ...aiMessages.slice(0, -1),
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ];
    } finally {
      aiStreaming = false;
    }
  }

  function applyAiPreview() {
    if (!aiPreview) return;
    if (selectedCardId) {
      // Edit mode — apply to the edit form and save
      editTitle = aiPreview.title;
      editSummary = aiPreview.summary;
      editValue = aiPreview.value;
      editViability = aiPreview.viability;
      aiPreview = null;
      saveCardEdit();
    } else {
      // Create mode — fields already auto-populated by $effect; just dismiss preview card
      aiPreview = null;
    }
  }

  function openAiCreate() {
    aiCreationMode = true;
    selectedCardId = null;
    newTitle = '';
    newSummary = '';
    newValue = 'High';
    newViability = 'Medium';
    newVisibility = 'Internal';
    loadSession('new', "Let's capture a new use case. What problem or opportunity are you thinking about?");
  }

  function selectCard(card: UseCase) {
    selectedCardId = card.id;
    editTitle = card.title;
    editSummary = card.summary;
    editContext = card.context ?? '';
    editValue = card.value;
    editViability = card.viability;
    editVisibility = card.visibility;
    aiCreationMode = false;
    isAiCollapsed = false;
    const prime = `I'm looking at **${card.title}** — ${card.summary}. What would you like to change or improve?`;
    loadSession(card.id, prime);
  }

  function deselectCard() {
    selectedCardId = null;
    saveSession();
    loadSession('new');
  }

  async function saveCardEdit() {
    if (!selectedCardId || savingEdit) return;
    savingEdit = true;
    try {
      const res = await fetch(`/api/workshop/${workshopId}/usecases/${selectedCardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          summary: editSummary.trim(),
          context: editContext.trim(),
          value: editValue,
          viability: editViability,
          visibility: editVisibility,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        cards = cards.map(c => c.id === selectedCardId ? { ...c, ...updated } : c);
        deselectCard();
      }
    } finally {
      savingEdit = false;
    }
  }

  async function openComments(cardId: string) {
    commentCardId = cardId;
    commentList = [];
    commentLoading = true;
    try {
      const res = await fetch(`/api/workshop/${workshopId}/usecases/${cardId}/comments`);
      if (res.ok) commentList = await res.json();
    } finally {
      commentLoading = false;
    }
  }

  async function postComment() {
    if (!commentInput.trim() || !commentCardId || commentPosting) return;
    commentPosting = true;
    try {
      const res = await fetch(`/api/workshop/${workshopId}/usecases/${commentCardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        commentList = [...commentList, comment];
        commentInput = '';
        cards = cards.map(c => c.id === commentCardId ? { ...c, commentCount: (c.commentCount ?? 0) + 1 } : c);
      }
    } finally {
      commentPosting = false;
    }
  }

  async function joinTeam(teamId: string) {
    console.log('[JOIN TEAM] Attempting to join team:', teamId);
    joiningTeam = true;
    try {
      const res = await fetch(`/api/workshop/${workshopId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          name: currentUser.name,
          initials: currentUser.initials,
          color: currentUser.color,
          role: currentUser.role
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[JOIN TEAM] Failed:', res.status, errorText);
        return;
      }

      const participant = await res.json();
      console.log('[JOIN TEAM] Success:', participant);
      me = participant;

      // Refresh participants list
      const r = await fetch(`/api/workshop/${workshopId}`);
      if (r.ok) {
        const overview = await r.json();
        participants = overview.participants ?? participants;
        teams = overview.teams ?? teams;
      }
    } catch (err) {
      console.error('[JOIN TEAM] Error:', err);
    } finally {
      joiningTeam = false;
    }
  }

  // Live data from server, mutated in real time via SSE
  let cards = $state<UseCase[]>(data.usecases ?? []);
  let teams = $state<BreakoutTeam[]>(data.teams ?? []);
  let participants = $state<Participant[]>(data.participants ?? []);
  let me = $state<Participant | null>(data.me ?? null);
  const currentUser = $derived(data.currentUser);

  // New use case form
  let newTitle = $state('');
  let newSummary = $state('');
  let newContext = $state('');
  let newValue = $state<'High' | 'Medium' | 'Low'>('High');
  let newViability = $state<'High' | 'Medium' | 'Low'>('Medium');
  let newVisibility = $state<'Internal' | 'Restricted' | 'Cross-Silo'>('Internal');
  let addingUseCase = $state(false);

  // Drag state
  let draggingId = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });
  let canvasEl = $state<HTMLDivElement | null>(null);

  // SSE
  let eventSource: EventSource | null = null;

  const workshop = $derived(data.workshop);
  const agenda = $derived(workshop?.agenda ?? []);

  // Participant color lookup
  const participantColor = (name: string) => {
    const p = participants.find(p => p.name === name);
    return p?.color ?? 'bg-gray-400';
  };

  // Breakout team lookup for a participant
  const teamForParticipant = (participantId: string) =>
    teams.find(t => t.memberIds.includes(participantId));

  const teamName = (teamId: string) =>
    teams.find(t => t.id === teamId)?.name ?? '';

  // Filter cards for current view
  const visibleCards = $derived(() => {
    if (viewMode === 'workshop-wide') return cards;
    const myTeam = me ? teamForParticipant(me.id) : null;
    if (teamFilter === 'Mine') return cards.filter(c => c.participantId === me?.id);
    if (teamFilter === 'All Teams') return cards;
    const t = teams.find(t => t.name === teamFilter);
    return t ? cards.filter(c => c.teamId === t.id) : cards;
  });

  // Cluster definitions computed from teams
  const workshopClusters = $derived(() => {
    const colors = [
      { color: 'rgba(107,150,149,0.08)', borderColor: 'rgba(107,150,149,0.3)', labelColor: '#6B9695' },
      { color: 'rgba(99,179,135,0.08)', borderColor: 'rgba(99,179,135,0.3)', labelColor: '#38A169' },
      { color: 'rgba(99,122,179,0.08)', borderColor: 'rgba(99,122,179,0.3)', labelColor: '#5A6FBA' },
    ];
    // Group cards by teamId
    const byTeam = new Map<string, UseCase[]>();
    cards.forEach(c => {
      if (!byTeam.has(c.teamId)) byTeam.set(c.teamId, []);
      byTeam.get(c.teamId)!.push(c);
    });
    return teams.map((team, i) => {
      const teamCards = byTeam.get(team.id) ?? [];
      const xs = teamCards.map(c => c.position.x);
      const ys = teamCards.map(c => c.position.y);
      const minX = xs.length ? Math.min(...xs) - 30 : i * 400;
      const minY = ys.length ? Math.min(...ys) - 50 : 30;
      const maxX = xs.length ? Math.max(...xs) + 280 : minX + 500;
      const maxY = ys.length ? Math.max(...ys) + 200 : minY + 280;
      return {
        id: i + 1,
        teamId: team.id,
        label: team.name,
        count: teamCards.length,
        ...colors[i % colors.length],
        rect: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      };
    });
  });

  // ── Drag ──────────────────────────────────────────────────────────────────────

  function onCardMouseDown(e: MouseEvent, card: UseCase) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    draggingId = card.id;
    dragStartPos = { x: e.clientX, y: e.clientY };
    didDrag = false;
    const rect = canvasEl!.getBoundingClientRect();
    dragOffset = {
      x: (e.clientX - rect.left) / zoom - card.position.x,
      y: (e.clientY - rect.top) / zoom - card.position.y,
    };
  }

  function onCanvasMouseMove(e: MouseEvent) {
    if (!draggingId || !canvasEl || viewMode === 'workshop-wide') return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDrag = true;
    const rect = canvasEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top) / zoom - dragOffset.y;
    cards = cards.map(c => c.id === draggingId ? { ...c, position: { x, y } } : c);
  }

  async function onCanvasMouseUp() {
    if (!draggingId) return;
    const id = draggingId;
    const wasDrag = didDrag;
    draggingId = null;
    didDrag = false;

    if (!wasDrag) {
      // Treat as click — open card for editing
      const card = cards.find(c => c.id === id);
      if (card) selectCard(card);
      return;
    }

    // Persist position after drag
    const card = cards.find(c => c.id === id);
    if (card) {
      await fetch(`/api/workshop/${workshopId}/usecases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: card.position }),
      });
    }
  }

  // ── API mutations ─────────────────────────────────────────────────────────────

  async function handleUpvote(id: string) {
    if (!me) return;
    const res = await fetch(`/api/workshop/${workshopId}/usecases/${id}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: me.id }),
    });
    if (res.ok) {
      const { upvotes } = await res.json();
      cards = cards.map(c => c.id === id ? { ...c, upvotes, upvotedBy: [...c.upvotedBy, me!.id] } : c);
    }
  }

  async function addUseCase() {
    if (!newTitle.trim() || !me) return;
    addingUseCase = true;

    const myTeam = teamForParticipant(me.id);
    if (!myTeam) { addingUseCase = false; return; }

    // Position near existing cards to avoid overlap
    const pos = { x: 80 + (cards.length % 4) * 220, y: 60 + Math.floor(cards.length / 4) * 240 };

    try {
      const res = await fetch(`/api/workshop/${workshopId}/usecases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          summary: newSummary.trim() || newTitle.trim(),
          context: newContext.trim(),
          value: newValue,
          viability: newViability,
          visibility: newVisibility,
          teamId: myTeam.id,
          participantId: me.id,
          position: pos,
          collaborators: [me.name],
        }),
      });

      if (res.ok) {
        const body = await res.json();
        const useCase = body.useCase ?? body;
        if (!cards.find(c => c.id === useCase.id)) cards = [...cards, useCase];
        newTitle = '';
        newSummary = '';
        newContext = '';
        newValue = 'High';
        newViability = 'Medium';
        newVisibility = 'Internal';
        aiCreationMode = false;
        aiPreview = null;
        saveSession();
        loadSession('new');
        if (voronoiRegions.length > 0) fetchAiClusters();
      } else {
        const errText = await res.text().catch(() => res.status.toString());
        console.error('addUseCase failed', res.status, errText);
      }
    } catch (err) {
      console.error('addUseCase error', err);
    } finally {
      addingUseCase = false;
    }
  }

  // ── View helpers ──────────────────────────────────────────────────────────────

  function switchView(mode: ViewMode) {
    viewMode = mode;
    if (mode === 'workshop-wide') {
      zoom = 0.65;
      teamFilter = 'All Teams';
      fetchAiClusters();
    } else {
      zoom = 1;
      teamFilter = 'Mine';
    }
    selectedCluster = null;
  }

  const workspaceLabel = $derived(() => {
    if (teamFilter === 'Mine') return 'My Workspace';
    if (teamFilter === 'All Teams') return 'All Workspaces';
    return `${teamFilter} Workspace`;
  });

  const collaboratorsLabel = $derived(() => {
    const t = teams.find(t => t.name === teamFilter);
    if (!t) return 'Your personal workspace';
    const names = t.memberIds.map(id => participants.find(p => p.id === id)?.name?.split(' ')[0]).filter(Boolean);
    return `Active collaborators: ${names.join(', ')}`;
  });

  // ── Tag colors ────────────────────────────────────────────────────────────────

  const valueColor = (v: string) =>
    v === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
    v === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-gray-50 text-gray-600 border-gray-200';

  const viabilityColor = (v: string) =>
    v === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    v === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-gray-50 text-gray-600 border-gray-200';

  const visibilityColor = (v: string) =>
    v === 'Restricted' ? 'bg-orange-50 text-orange-700 border-orange-200' :
    v === 'Cross-Silo' ? 'bg-purple-50 text-purple-700 border-purple-200' :
    'bg-gray-50 text-gray-600 border-gray-200';

  // ── SSE ───────────────────────────────────────────────────────────────────────

  onMount(() => {
    eventSource = new EventSource(`/api/workshop/${workshopId}/stream`);
    eventSource.onmessage = (e) => {
      try {
        const event: WorkshopEvent = JSON.parse(e.data);
        handleSSEEvent(event);
      } catch {}
    };
  });

  onDestroy(() => {
    eventSource?.close();
  });

  function handleSSEEvent(event: WorkshopEvent) {
    const d = event.data as any;
    if (event.type === 'usecase_added') {
      if (!cards.find(c => c.id === d.id)) {
        cards = [...cards, d];
        if (voronoiRegions.length > 0) fetchAiClusters();
      }
    } else if (event.type === 'usecase_updated') {
      cards = cards.map(c => c.id === d.id ? { ...c, ...d } : c);
    } else if (event.type === 'usecase_upvoted') {
      cards = cards.map(c => c.id === d.id ? { ...c, upvotes: d.upvotes } : c);
    } else if (event.type === 'usecase_deleted') {
      cards = cards.filter(c => c.id !== d.id);
    } else if (event.type === 'team_created') {
      if (!teams.find(t => t.id === d.id)) teams = [...teams, d];
    } else if (event.type === 'team_updated') {
      teams = teams.map(t => t.id === d.id ? { ...t, ...d } : t);
    } else if (event.type === 'team_deleted') {
      teams = teams.filter(t => t.id !== d.id);
    } else if (event.type === 'comment_added') {
      // Increment count on card
      cards = cards.map(c => c.id === d.useCaseId ? { ...c, commentCount: (c.commentCount ?? 0) + 1 } : c);
      // Append to open drawer
      if (commentCardId === d.useCaseId) {
        const alreadyHave = commentList.find(c => c.id === d.comment.id);
        if (!alreadyHave) commentList = [...commentList, d.comment];
      }
    } else if (event.type === 'participant_joined') {
      if (!participants.find(p => p.id === d.id)) participants = [...participants, d];
      else participants = participants.map(p => p.id === d.id ? { ...p, ...d } : p);
    }
  }
</script>

<div class="h-screen flex flex-col bg-[#FAFAF9] overflow-hidden" style="font-family: Inter, sans-serif;">

  <!-- Top Nav Bar -->
  <div class="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30">
    <div class="flex items-center gap-3">
      <a href="/" class="text-[16px] font-bold text-gray-900 tracking-tight hover:opacity-80">optura</a>
      <span class="text-gray-300">|</span>
      <span class="text-[13px] text-gray-700 font-medium">{workshop?.title ?? 'Workshop'}</span>
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#D1FAE5] text-[#065F46] font-medium">Live</span>
    </div>

    <!-- View Toggle -->
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-0.5 bg-[#F5F5F5] border border-gray-200 rounded-lg p-0.5">
        <button onclick={() => switchView('individual')}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-all font-medium {viewMode === 'individual' ? 'bg-[#6B9695] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My View
        </button>
        <button onclick={() => switchView('workshop-wide')}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-all font-medium {viewMode === 'workshop-wide' ? 'bg-[#6B9695] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Workshop View
        </button>
      </div>

      {#if viewMode === 'individual'}
        <div class="relative flex items-center gap-1.5 bg-[#F5F5F5] border border-gray-200 rounded-lg px-3 py-1.5">
          <span class="text-[11px] text-gray-600 font-medium">View:</span>
          <select bind:value={teamFilter}
            class="bg-transparent text-[12px] text-gray-700 font-medium cursor-pointer focus:outline-none appearance-none pr-4">
            <option value="Mine">Mine</option>
            {#each teams as t}<option value={t.name}>{t.name}</option>{/each}
            <option value="All Teams">All Teams</option>
          </select>
          <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if me}
        <div class="flex items-center gap-1.5 text-[12px] text-gray-500">
          <div class="w-5 h-5 rounded-full {me.color} flex items-center justify-center text-[9px] text-white font-semibold">{me.initials}</div>
          <span class="font-medium text-gray-700">{me.name.split(' ')[0]} {me.name.split(' ')[1]}</span>
        </div>
      {/if}
      {#if viewMode !== 'workshop-wide'}
        <button onclick={openAiCreate}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Use Case
        </button>
      {/if}
      <button onclick={() => goto(`/workshops/${workshopId}/post`)}
        class="px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-900 rounded-lg text-[12px] font-medium transition-colors">
        Complete Workshop
      </button>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden">

    <!-- Left Sidebar -->
    {#if !isNavCollapsed}
      <div class="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
        <!-- Agenda -->
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Agenda</h3>
          <div class="space-y-1">
            {#each agenda as item}
              <div class="flex items-start gap-2 py-1.5 px-2 rounded-md {item.isActive ? 'bg-[#F0F9F9]' : ''}">
                <div class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 {item.isActive ? 'bg-[#6B9695]' : 'bg-gray-300'}"></div>
                <div>
                  <p class="text-[12px] {item.isActive ? 'text-[#6B9695] font-semibold' : 'text-gray-700 font-medium'}">{item.title}</p>
                  <p class="text-[11px] text-gray-400">{item.description}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Participants -->
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Participants</h3>
          <div class="space-y-2">
            {#each participants as p}
              <div class="flex items-center gap-2">
                <div class="relative">
                  <div class="w-6 h-6 rounded-full {p.color} flex items-center justify-center text-[10px] text-white font-semibold shrink-0">{p.initials}</div>
                  <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white {p.presence === 'in-room' ? 'bg-green-400' : 'bg-yellow-400'}"></div>
                </div>
                <div class="min-w-0">
                  <p class="text-[12px] text-gray-900 font-medium truncate">{p.id === me?.id ? 'You' : p.name.split(' ').slice(-1)[0]}</p>
                  <p class="text-[10px] text-gray-400 capitalize">{p.presence}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Breakout Teams -->
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Breakout Teams</h3>
          <div class="space-y-3">
            {#each teams as team}
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[12px] text-gray-900 font-semibold">{team.name}</span>
                  <span class="text-[10px] text-green-600 font-medium">● {team.memberIds.length} Active</span>
                </div>
                <div class="space-y-1">
                  {#each team.memberIds as pid}
                    {@const p = participants.find(p => p.id === pid)}
                    {#if p}
                      <p class="text-[11px] text-gray-600 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full inline-block {p.color.replace('bg-', 'bg-')}"></span>
                        {p.name}
                      </p>
                    {/if}
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Workshop Context -->
        {#if workshop?.objective || workshop?.strategicPillars || workshop?.contributorInputs}
          <div class="p-4">
            <button onclick={() => contextExpanded = !contextExpanded}
              class="w-full flex items-center justify-between mb-3">
              <h3 class="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Workshop Context</h3>
              <svg class="w-3 h-3 text-gray-400 transition-transform {contextExpanded ? 'rotate-180' : ''}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {#if contextExpanded}
              <div class="space-y-3">
                {#if workshop.objective}
                  <div>
                    <p class="text-[10px] text-gray-500 font-medium mb-1">Objective</p>
                    <p class="text-[11px] text-gray-700 leading-relaxed">{workshop.objective}</p>
                  </div>
                {/if}

                {#if workshop.strategicPillars && workshop.strategicPillars.length > 0}
                  <div>
                    <p class="text-[10px] text-gray-500 font-medium mb-1.5">Strategic Pillars</p>
                    <div class="flex flex-wrap gap-1">
                      {#each workshop.strategicPillars as pillar}
                        <span class="px-2 py-0.5 bg-[#E6F4F4] text-[#6B9695] rounded text-[10px] font-medium">
                          {pillar}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if workshop.contributorInputs && workshop.contributorInputs.length > 0}
                  <div>
                    <button onclick={() => painPointsExpanded = !painPointsExpanded}
                      class="w-full flex items-center justify-between mb-1.5">
                      <p class="text-[10px] text-gray-500 font-medium">Pain Points ({workshop.contributorInputs.length})</p>
                      <svg class="w-3 h-3 text-gray-400 transition-transform {painPointsExpanded ? 'rotate-180' : ''}"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {#if painPointsExpanded}
                      <div class="space-y-2 max-h-40 overflow-y-auto">
                        {#each workshop.contributorInputs as input}
                          {#if input.painPoints}
                            <div class="bg-gray-50 rounded p-2">
                              <p class="text-[10px] text-gray-600 font-medium mb-0.5">{input.name}</p>
                              <p class="text-[10px] text-gray-500 leading-relaxed">{input.painPoints}</p>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Main Canvas -->
    <div
      bind:this={canvasEl}
      onmousemove={onCanvasMouseMove}
      onmouseup={onCanvasMouseUp}
      onmouseleave={onCanvasMouseUp}
      class="flex-1 relative overflow-hidden"
      style="background-color: #FAFAF9; background-image: linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px); background-size: 40px 40px; cursor: {draggingId ? 'grabbing' : 'default'};"
    >
      <!-- Sidebar toggle -->
      <button onclick={() => isNavCollapsed = !isNavCollapsed}
        class="absolute top-3 left-3 z-20 p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm" title="Toggle sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <!-- Workspace header (individual view) -->
      {#if viewMode === 'individual' && teamFilter !== 'All Teams'}
        <div class="absolute top-3 left-12 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2">
          <h2 class="text-[13px] text-gray-900 font-semibold">{workspaceLabel()}</h2>
          <p class="text-[11px] text-gray-500">{collaboratorsLabel()}</p>
        </div>
      {/if}

      <!-- Workshop-wide banner -->
      {#if viewMode === 'workshop-wide'}
        <div class="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div class="flex items-center gap-3 px-4 py-2 bg-[#1E2A38] text-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="text-[12px] font-medium">Workshop Overview — {workshop?.title}</span>
            <span class="text-[11px] text-gray-400">{participants.length} participants · {cards.length} use cases · {teams.length} teams</span>
            {#if aiClusterLoading}
              <span class="flex items-center gap-1.5 text-[11px] text-[#6B9695]">
                <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Clustering...
              </span>
            {:else if aiClusters.length > 0}
              <span class="text-[11px] text-gray-400">{aiClusters.length} clusters</span>
              <button onclick={fetchAiClusters}
                class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Re-cluster
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Zoomable canvas -->
      <div class="absolute inset-0 pt-16" style="transform: scale({zoom}); transform-origin: 0 0; transition: {draggingId ? 'none' : 'transform 0.1s ease-out'};">

        <!-- Voronoi cluster regions (workshop view with AI clusters) -->
        {#if viewMode === 'workshop-wide' && voronoiRegions.length > 0}
          <!-- SVG Voronoi polygons -->
          <svg class="absolute" style="left:0;top:0;width:{CANVAS_W}px;height:{CANVAS_H}px;overflow:visible;pointer-events:none;">
            {#each voronoiRegions as region}
              <polygon
                points={region.polygon.map(p => `${p.x},${p.y}`).join(' ')}
                fill={selectedCluster === region.id ? region.color.replace('0.10', '0.18') : region.color}
                stroke={region.borderColor}
                stroke-width="1.5"
                stroke-dasharray="8 5"
                opacity={selectedCluster !== null && selectedCluster !== region.id ? 0.25 : 1}
                style="pointer-events:fill;cursor:pointer;transition:fill 0.2s,opacity 0.2s"
                onclick={() => selectedCluster = selectedCluster === region.id ? null : region.id}
              />
            {/each}
          </svg>

          <!-- Cluster labels at Voronoi centroids -->
          {#each voronoiRegions as region}
            {#if region.count > 1}
              <div class="absolute" style="left:{region.centroid.x}px;top:{region.centroid.y - (region.count > 3 ? 160 : 120)}px;transform:translateX(-50%);pointer-events:none;z-index:2;">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                  style="background:{selectedCluster === region.id ? region.labelColor : 'white'};color:{selectedCluster === region.id ? 'white' : region.labelColor};border:1.5px solid {region.borderColor};box-shadow:0 1px 4px rgba(0,0,0,0.10);">
                  {region.theme}
                  <span class="text-[9px] px-1 rounded-full" style="background:rgba(255,255,255,0.3);">{region.count}</span>
                </span>
              </div>
            {/if}
          {/each}

        {:else if viewMode === 'workshop-wide' && !aiClusterLoading}
          <!-- Fallback: team-based rectangular clusters while loading -->
          {#each workshopClusters() as cluster}
            <div
              class="absolute rounded-2xl transition-all duration-200 cursor-pointer"
              style="left:{cluster.rect.x}px;top:{cluster.rect.y}px;width:{cluster.rect.w}px;height:{cluster.rect.h}px;background:{selectedCluster === cluster.id ? cluster.color.replace('0.08','0.14') : cluster.color};border:1.5px dashed {cluster.borderColor};opacity:{selectedCluster !== null && selectedCluster !== cluster.id ? 0.3 : 1};"
              role="button" tabindex="0"
              onclick={() => selectedCluster = selectedCluster === cluster.id ? null : cluster.id}
              onkeydown={(e) => e.key === 'Enter' && (selectedCluster = selectedCluster === cluster.id ? null : cluster.id)}
            >
              <div class="absolute -top-5 left-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style="background:{selectedCluster === cluster.id ? cluster.labelColor : 'white'};color:{selectedCluster === cluster.id ? 'white' : cluster.labelColor};border:1.5px solid {cluster.borderColor};box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                  {cluster.label}
                  <span class="text-[9px] px-1 rounded-full" style="background:rgba(255,255,255,0.25);">{cluster.count}</span>
                </span>
              </div>
            </div>
          {/each}
        {/if}

        <!-- Use case cards -->
        {#each visibleCards() as card (card.id)}
          {@const cardPos = (viewMode === 'workshop-wide' && clusteredCardPositions[card.id]) ? clusteredCardPositions[card.id] : card.position}
          {@const inSelectedCluster = selectedCluster === null || (viewMode === 'workshop-wide' && voronoiRegions.length > 0
            ? voronoiRegions.find(r => r.useCaseIds.has(card.id))?.id === selectedCluster
            : workshopClusters().find(c => c.teamId === card.teamId)?.id === selectedCluster)}
          {#if inSelectedCluster}
            <div
              onmousedown={(e) => onCardMouseDown(e, card)}
              class="absolute bg-white rounded-xl border border-gray-200 p-4 w-64 shadow-md hover:shadow-lg group select-none"
              style="
                left: {cardPos.x}px; top: {cardPos.y}px;
                cursor: {draggingId === card.id ? 'grabbing' : 'grab'};
                z-index: {draggingId === card.id ? 20 : 1};
                box-shadow: {draggingId === card.id ? '0 12px 32px rgba(0,0,0,0.18)' : ''};
                transition: {draggingId === card.id ? 'none' : 'box-shadow 0.15s'};
              "
            >
              <!-- Team + AI row -->
              <div class="flex items-center justify-between mb-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  {teamName(card.teamId)}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-40"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>

              <h4 class="text-[13px] text-gray-900 font-semibold mb-1">{card.title}</h4>
              <p class="text-[12px] text-gray-600 mb-2.5">{card.summary}</p>

              <!-- Strategic Pillar Tags -->
              {#if card.pillarTags && card.pillarTags.length > 0}
                <div class="mb-2 flex flex-wrap gap-1">
                  {#each card.pillarTags as pillar}
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#d0af51]/10 text-[#d0af51] border border-[#d0af51]/30 font-medium">
                      ✦ {pillar}
                    </span>
                  {/each}
                </div>
              {/if}

              <!-- Collaborators -->
              {#if card.collaborators?.length}
                <div class="mb-2 flex flex-wrap gap-1">
                  {#each card.collaborators as name}
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                      👤 {name.split(' ')[0]}
                    </span>
                  {/each}
                </div>
              {/if}

              <!-- Cross-team overlap -->
              {#if card.crossTeamOverlap}
                <div class="mb-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Also seen in {card.crossTeamOverlap}
                  </span>
                </div>
              {/if}

              <!-- Tags -->
              <div class="flex flex-wrap gap-1.5 mb-2.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {valueColor(card.value)}">Value: {card.value}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {viabilityColor(card.viability)}">Viability: {card.viability}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {visibilityColor(card.visibility)}">{card.visibility}</span>
              </div>

              <!-- Interaction bar -->
              <div class="flex items-center justify-between pt-2 border-t border-gray-100 mb-1">
                <div class="flex items-center gap-1">
                  <button
                    onmousedown={(e) => e.stopPropagation()}
                    onclick={() => handleUpvote(card.id)}
                    class="flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-[10px] font-medium {card.upvotedBy?.includes(me?.id ?? '') ? 'bg-[#6B9695] text-white' : 'hover:bg-gray-100 text-gray-600'}"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    {card.upvotes}
                  </button>
                  <button
                    onmousedown={(e) => e.stopPropagation()}
                    onclick={() => openComments(card.id)}
                    class="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-500 text-[10px] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {card.commentCount ?? 0}
                  </button>
                </div>
                <button onmousedown={(e) => e.stopPropagation()}
                  class="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F0F9F9] text-[#6B9695] text-[10px] font-medium transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  AI
                </button>
              </div>

              <div class="flex items-center justify-between text-[10px] text-gray-400">
                <span>{card.addedBy}</span>
                <span>{new Date(card.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Zoom Controls -->
      <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
        <button onclick={() => zoom = Math.max(zoom - 0.1, 0.2)} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Zoom out">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <span class="px-2 text-[11px] text-gray-600 font-medium min-w-[44px] text-center">{Math.round(zoom * 100)}%</span>
        <button onclick={() => zoom = Math.min(zoom + 0.1, 2)} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Zoom in">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
      </div>

      <!-- Card count badge -->
      <div class="absolute bottom-5 right-5 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-[11px] text-gray-600 font-medium">
        {visibleCards().length} / {cards.length} use cases
      </div>
    </div>

    <!-- AI Analyst Panel -->
    {#if !isAiCollapsed}
      <div class="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <h3 class="text-[14px] text-gray-900 font-semibold">AI Analyst</h3>
            </div>
            <p class="text-[11px] {(aiCreationMode || selectedCardId) ? 'text-[#6B9695] font-medium' : 'text-gray-500'}">
              {#if selectedCardId}
                {@const c = cards.find(c => c.id === selectedCardId)}
                Editing: {c?.title ?? 'use case'}
              {:else if aiCreationMode}
                Creating use case...
              {:else}
                Analyzing {teamFilter === 'Mine' ? 'your workspace' : teamFilter === 'All Teams' ? 'all workspaces' : `${teamFilter} workspace`}...
              {/if}
            </p>
          </div>
          <button onclick={() => isAiCollapsed = true} class="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Collapse">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-4" id="ai-messages-container">
          {#if aiMessages.length === 0}
            <div class="text-center py-8">
              <p class="text-[12px] text-gray-400 leading-relaxed">Describe a use case idea and I'll help you structure it into a card.</p>
            </div>
          {/if}

          {#each aiMessages as msg}
            {#if msg.role === 'user'}
              <div class="flex justify-end">
                <div class="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                  <p class="text-[13px] text-gray-900">{msg.content}</p>
                </div>
              </div>
            {:else}
              {@const displayContent = msg.content.replace(/<usecase_preview>[\s\S]*?<\/usecase_preview>/g, '').trim()}
              {#if displayContent}
                <div class="flex justify-start">
                  <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p class="text-[13px] text-gray-900 whitespace-pre-wrap">{displayContent}{#if aiStreaming && msg === aiMessages[aiMessages.length - 1]}<span class="inline-block w-1.5 h-3.5 bg-[#6B9695] ml-0.5 animate-pulse rounded-sm"></span>{/if}</p>
                  </div>
                </div>
              {:else if aiStreaming && msg === aiMessages[aiMessages.length - 1]}
                <div class="flex justify-start">
                  <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3">
                    <span class="inline-block w-1.5 h-3.5 bg-[#6B9695] animate-pulse rounded-sm"></span>
                  </div>
                </div>
              {/if}
            {/if}
          {/each}

          {#if aiPreview}
            <div class="bg-white border-2 border-[#6B9695] rounded-xl p-4 w-full">
              <div class="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span class="text-[11px] text-[#6B9695] font-semibold uppercase tracking-wide">Structured Preview</span>
              </div>
              <div class="space-y-2 mb-4">
                <div>
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Title</p>
                  <p class="text-[13px] text-gray-900 font-semibold">{aiPreview.title}</p>
                </div>
                <div>
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Summary</p>
                  <p class="text-[12px] text-gray-700">{aiPreview.summary}</p>
                </div>
                <div class="flex gap-3">
                  <div>
                    <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Value</p>
                    <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {aiPreview.value === 'High' ? 'bg-red-50 text-red-700 border-red-200' : aiPreview.value === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-600 border-gray-200'}">{aiPreview.value}</span>
                  </div>
                  <div>
                    <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Viability</p>
                    <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {aiPreview.viability === 'High' ? 'bg-blue-50 text-blue-700 border-blue-200' : aiPreview.viability === 'Medium' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'}">{aiPreview.viability}</span>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button onclick={applyAiPreview} disabled={addingUseCase || savingEdit}
                  class="flex-1 px-3 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {selectedCardId ? (savingEdit ? 'Saving...' : 'Apply Changes') : (addingUseCase ? 'Adding...' : 'Create Use Case Card')}
                </button>
                <button onclick={() => aiPreview = null}
                  class="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          {/if}
        </div>

        <div class="p-4 border-t border-gray-200">
          <div class="flex gap-2">
            <input type="text" placeholder="Describe a use case..." bind:value={aiInput}
              onkeydown={(e) => e.key === 'Enter' && sendAiMessage()}
              disabled={aiStreaming}
              class="flex-1 px-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent disabled:opacity-50" />
            <button onclick={sendAiMessage} disabled={aiStreaming || !aiInput.trim()}
              class="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {aiStreaming ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    {:else}
      <button onclick={() => isAiCollapsed = false}
        class="w-10 bg-white border-l border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors shrink-0" title="Open AI Analyst">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="text-[10px] text-gray-500 font-medium" style="writing-mode: vertical-rl; transform: rotate(180deg);">AI Analyst</span>
      </button>
    {/if}
  </div>
</div>

<!-- Add Use Case Modal -->
<!-- AI-Assisted Create Use Case Modal -->
{#if aiCreationMode}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden" style="height: min(680px, calc(100vh - 48px))">

      <!-- Left: live form -->
      <div class="w-[360px] shrink-0 border-r border-gray-200 flex flex-col">
        <div class="px-6 py-5 border-b border-gray-100">
          <h3 class="text-[16px] text-gray-900 font-bold">New Use Case</h3>
          <p class="text-[11px] text-gray-400 mt-0.5">Fields update automatically as the AI structures your idea.</p>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label for="uc-title" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Title</label>
            <input id="uc-title" type="text" bind:value={newTitle} placeholder="Short descriptive title"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-[#FAFAF9] transition-colors {newTitle ? 'border-[#6B9695]/40' : ''}" />
          </div>
          <div>
            <label for="uc-summary" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Summary</label>
            <textarea id="uc-summary" bind:value={newSummary} rows="4" placeholder="What problem does AI solve here?"
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none bg-[#FAFAF9] transition-colors {newSummary ? 'border-[#6B9695]/40' : ''}"></textarea>
          </div>
          <div>
            <label for="uc-context" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Context / Notes</label>
            <textarea id="uc-context" bind:value={newContext} rows="2" placeholder="Additional context or implementation notes..."
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none bg-[#FAFAF9] transition-colors {newContext ? 'border-[#6B9695]/40' : ''}"></textarea>
          </div>
          <div class="grid grid-cols-3 gap-2.5">
            <div>
              <label for="uc-value" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Value</label>
              <select id="uc-value" bind:value={newValue} class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-[#FAFAF9]">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label for="uc-viability" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Viability</label>
              <select id="uc-viability" bind:value={newViability} class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-[#FAFAF9]">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label for="uc-visibility" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Visibility</label>
              <select id="uc-visibility" bind:value={newVisibility} class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-[#FAFAF9]">
                <option>Internal</option><option>Restricted</option><option>Cross-Silo</option>
              </select>
            </div>
          </div>
          {#if me}
            <p class="text-[11px] text-gray-400">Adding as <span class="font-medium text-gray-600">{me.name}</span> · {teamForParticipant(me.id)?.name ?? 'no team'}</p>
          {/if}
        </div>

        <div class="px-6 py-4 border-t border-gray-100 flex gap-2.5">
          <button onclick={() => { aiCreationMode = false; aiPreview = null; }}
            class="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
            Cancel
          </button>
          <button onclick={addUseCase} disabled={addingUseCase || !newTitle.trim()}
            class="flex-1 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {addingUseCase ? 'Adding...' : 'Create Card'}
          </button>
        </div>
      </div>

      <!-- Right: AI Analyst chat -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div>
              <h3 class="text-[14px] text-gray-900 font-semibold">AI Analyst</h3>
              <p class="text-[11px] text-[#6B9695] font-medium">Structuring your idea...</p>
            </div>
          </div>
          <button onclick={() => { aiCreationMode = false; aiPreview = null; }} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {#if aiMessages.length === 0}
            <div class="text-center py-10">
              <p class="text-[13px] text-gray-400">Describe the problem or opportunity you have in mind.</p>
            </div>
          {/if}

          {#each aiMessages as msg}
            {#if msg.role === 'user'}
              <div class="flex justify-end">
                <div class="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                  <p class="text-[13px] text-gray-900">{msg.content}</p>
                </div>
              </div>
            {:else}
              {@const displayContent = msg.content.replace(/<usecase_preview>[\s\S]*?<\/usecase_preview>/g, '').trim()}
              {#if displayContent}
                <div class="flex justify-start">
                  <div class="flex gap-2.5 max-w-[85%]">
                    <div class="w-6 h-6 rounded-full bg-[#6B9695]/15 flex items-center justify-center shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3">
                      <p class="text-[13px] text-gray-900 whitespace-pre-wrap">{displayContent}{#if aiStreaming && msg === aiMessages[aiMessages.length - 1]}<span class="inline-block w-1.5 h-3.5 bg-[#6B9695] ml-0.5 animate-pulse rounded-sm"></span>{/if}</p>
                    </div>
                  </div>
                </div>
              {:else if aiStreaming && msg === aiMessages[aiMessages.length - 1]}
                <div class="flex justify-start">
                  <div class="w-6 h-6 rounded-full bg-[#6B9695]/15 flex items-center justify-center shrink-0 mt-0.5 mr-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3">
                    <span class="inline-block w-1.5 h-3.5 bg-[#6B9695] animate-pulse rounded-sm"></span>
                  </div>
                </div>
              {/if}
            {/if}
          {/each}
        </div>

        <!-- Input -->
        <div class="px-6 py-4 border-t border-gray-100 shrink-0">
          <div class="flex gap-2">
            <input type="text" placeholder="Describe your use case idea..." bind:value={aiInput}
              onkeydown={(e) => e.key === 'Enter' && sendAiMessage()}
              disabled={aiStreaming}
              class="flex-1 px-3.5 py-2.5 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent disabled:opacity-50" />
            <button onclick={sendAiMessage} disabled={aiStreaming || !aiInput.trim()}
              class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {aiStreaming ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
{/if}

<!-- Team Selection Modal -->
{#if data.needsTeamSelection && !me}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
      <div class="mb-5">
        <h3 class="text-[18px] text-gray-900 font-bold mb-1">Welcome to the workshop</h3>
        <p class="text-[13px] text-gray-500">Choose your breakout team to get started.</p>
      </div>
      <div class="space-y-2.5">
        {#each teams as team}
          <button
            onclick={() => joinTeam(team.id)}
            disabled={joiningTeam}
            class="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 hover:border-[#6B9695] hover:bg-[#F0F9F9] rounded-xl transition-colors text-left disabled:opacity-50">
            <div>
              <p class="text-[14px] font-semibold text-gray-900">{team.name}</p>
              <p class="text-[11px] text-gray-500">{team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Comment Drawer -->
{#if commentCardId}
  {@const card = cards.find(c => c.id === commentCardId)}
  <div class="fixed inset-0 z-50 flex justify-end" onclick={(e) => e.target === e.currentTarget && (commentCardId = null)}>
    <div class="w-full max-w-sm bg-white border-l border-gray-200 shadow-2xl flex flex-col h-full">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
        <div class="min-w-0 flex-1 pr-3">
          <h3 class="text-[14px] font-semibold text-gray-900 mb-0.5 truncate">{card?.title ?? 'Comments'}</h3>
          <p class="text-[11px] text-gray-500">{commentList.length} comment{commentList.length !== 1 ? 's' : ''}</p>
        </div>
        <button onclick={() => commentCardId = null} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Comments list -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        {#if commentLoading}
          <p class="text-[13px] text-gray-400 text-center py-8">Loading...</p>
        {:else if commentList.length === 0}
          <div class="text-center py-10">
            <svg class="mx-auto mb-3 text-gray-300" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p class="text-[13px] text-gray-400">No comments yet. Be the first!</p>
          </div>
        {:else}
          {#each commentList as comment}
            <div class="flex gap-3">
              <div class="w-7 h-7 rounded-full {comment.authorColor} flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-0.5">
                {comment.authorInitials}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-[12px] font-semibold text-gray-900">{comment.authorName}</span>
                  <span class="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p class="text-[13px] text-gray-700 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-200">
        {#if me}
          <div class="flex gap-2 items-end">
            <div class="w-7 h-7 rounded-full {me.color} flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {me.initials}
            </div>
            <div class="flex-1 flex gap-2">
              <textarea
                bind:value={commentInput}
                onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                placeholder="Add a comment..."
                rows="2"
                class="flex-1 px-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none"
              ></textarea>
              <button
                onclick={postComment}
                disabled={commentPosting || !commentInput.trim()}
                class="px-3 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 self-end">
                {commentPosting ? '...' : 'Post'}
              </button>
            </div>
          </div>
          <p class="text-[10px] text-gray-400 mt-1.5 ml-9">Enter to post · Shift+Enter for new line</p>
        {:else}
          <p class="text-[12px] text-gray-400 text-center">Join the workshop to comment.</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Edit Use Case Modal -->
{#if selectedCardId}
  {@const editingCard = cards.find(c => c.id === selectedCardId)}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onclick={(e) => e.target === e.currentTarget && deselectCard()}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
      <div class="flex items-start justify-between mb-5">
        <div>
          <h3 class="text-[18px] text-gray-900 font-bold">Edit Use Case</h3>
          {#if editingCard}
            <p class="text-[11px] text-gray-400 mt-0.5">Added by {editingCard.addedBy}</p>
          {/if}
        </div>
        <button onclick={deselectCard} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="edit-title" class="block text-[12px] text-gray-600 font-medium mb-1">Title</label>
          <input id="edit-title" type="text" bind:value={editTitle} maxlength="80"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695]"
            placeholder="Short descriptive title" />
        </div>
        <div>
          <label for="edit-summary" class="block text-[12px] text-gray-600 font-medium mb-1">Summary</label>
          <textarea id="edit-summary" bind:value={editSummary} rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none"
            placeholder="One sentence describing the AI use case"></textarea>
        </div>
        <div>
          <label for="edit-context" class="block text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Context / Notes</label>
          <textarea id="edit-context" bind:value={editContext} rows="2"
            placeholder="Additional context or implementation notes..."
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none bg-[#FAFAF9] transition-colors"></textarea>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="edit-value" class="block text-[12px] text-gray-600 font-medium mb-1">Value</label>
            <select id="edit-value" bind:value={editValue}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <label for="edit-viability" class="block text-[12px] text-gray-600 font-medium mb-1">Viability</label>
            <select id="edit-viability" bind:value={editViability}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <label for="edit-visibility" class="block text-[12px] text-gray-600 font-medium mb-1">Visibility</label>
            <select id="edit-visibility" bind:value={editVisibility}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>Internal</option><option>Restricted</option><option>Cross-Silo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-gray-100">
        <p class="text-[11px] text-gray-400 mb-4">Tip: use the AI Analyst panel to suggest changes — click "Apply Changes" to auto-fill these fields.</p>
        <div class="flex gap-3">
          <button onclick={deselectCard}
            class="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
            Cancel
          </button>
          <button onclick={saveCardEdit} disabled={savingEdit || !editTitle.trim()}
            class="flex-1 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
