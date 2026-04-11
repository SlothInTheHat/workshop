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
  let selectedCluster = $state<number | null>(null);
  let showAddModal = $state(false);

  // Live data from server, mutated in real time via SSE
  let cards = $state<UseCase[]>(data.usecases ?? []);
  let teams = $state<BreakoutTeam[]>(data.teams ?? []);
  let participants = $state<Participant[]>(data.participants ?? []);
  let me = $state<Participant | null>(data.me ?? null);

  // New use case form
  let newTitle = $state('');
  let newSummary = $state('');
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
    const rect = canvasEl!.getBoundingClientRect();
    dragOffset = {
      x: (e.clientX - rect.left) / zoom - card.position.x,
      y: (e.clientY - rect.top) / zoom - card.position.y,
    };
  }

  function onCanvasMouseMove(e: MouseEvent) {
    if (!draggingId || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top) / zoom - dragOffset.y;
    cards = cards.map(c => c.id === draggingId ? { ...c, position: { x, y } } : c);
  }

  async function onCanvasMouseUp() {
    if (!draggingId) return;
    const id = draggingId;
    draggingId = null;
    // Persist position
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

    const res = await fetch(`/api/workshop/${workshopId}/usecases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        summary: newSummary.trim() || newTitle.trim(),
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
      const { useCase } = await res.json();
      cards = [...cards, useCase];
      newTitle = '';
      newSummary = '';
      newValue = 'High';
      newViability = 'Medium';
      newVisibility = 'Internal';
      showAddModal = false;
    }
    addingUseCase = false;
  }

  // ── View helpers ──────────────────────────────────────────────────────────────

  function switchView(mode: ViewMode) {
    viewMode = mode;
    if (mode === 'workshop-wide') { zoom = 0.65; teamFilter = 'All Teams'; }
    else { zoom = 1; teamFilter = 'Mine'; }
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
      if (!cards.find(c => c.id === d.id)) cards = [...cards, d];
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
      <button onclick={() => showAddModal = true}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Use Case
      </button>
      <button onclick={() => goto(`/workshop/${workshopId}/summary`)}
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
        <div class="p-4">
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
          <div class="flex items-center gap-2 px-4 py-2 bg-[#1E2A38] text-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="text-[12px] font-medium">Workshop Overview — {workshop?.title}</span>
            <span class="text-[11px] text-gray-400 ml-2">{participants.length} participants · {cards.length} use cases · {teams.length} teams</span>
          </div>
        </div>
      {/if}

      <!-- Zoomable canvas -->
      <div class="absolute inset-0 pt-16" style="transform: scale({zoom}); transform-origin: 0 0; transition: {draggingId ? 'none' : 'transform 0.1s ease-out'};">

        <!-- Cluster backgrounds (workshop view) -->
        {#if viewMode === 'workshop-wide'}
          {#each workshopClusters() as cluster}
            <div
              class="absolute rounded-2xl transition-all duration-200 cursor-pointer"
              style="
                left: {cluster.rect.x}px; top: {cluster.rect.y}px;
                width: {cluster.rect.w}px; height: {cluster.rect.h}px;
                background: {selectedCluster === cluster.id ? cluster.color.replace('0.08', '0.14') : cluster.color};
                border: 1.5px dashed {cluster.borderColor};
                opacity: {selectedCluster !== null && selectedCluster !== cluster.id ? 0.3 : 1};
              "
              role="button" tabindex="0"
              onclick={() => selectedCluster = selectedCluster === cluster.id ? null : cluster.id}
              onkeydown={(e) => e.key === 'Enter' && (selectedCluster = selectedCluster === cluster.id ? null : cluster.id)}
            >
              <div class="absolute -top-5 left-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style="background: {selectedCluster === cluster.id ? cluster.labelColor : 'white'}; color: {selectedCluster === cluster.id ? 'white' : cluster.labelColor}; border: 1.5px solid {cluster.borderColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                  {cluster.label}
                  <span class="text-[9px] px-1 rounded-full" style="background: rgba(255,255,255,0.25);">{cluster.count}</span>
                </span>
              </div>
            </div>
          {/each}
        {/if}

        <!-- Use case cards -->
        {#each visibleCards() as card (card.id)}
          {#if selectedCluster === null || workshopClusters().find(c => c.teamId === card.teamId)?.id === selectedCluster}
            <div
              onmousedown={(e) => onCardMouseDown(e, card)}
              class="absolute bg-white rounded-xl border border-gray-200 p-4 w-64 shadow-md hover:shadow-lg group select-none"
              style="
                left: {card.position.x}px; top: {card.position.y}px;
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
                  <span class="flex items-center gap-1 px-2 py-1 text-gray-500 text-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {card.comments}
                  </span>
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
            <p class="text-[11px] text-gray-500">
              Analyzing {teamFilter === 'Mine' ? 'your workspace' : teamFilter === 'All Teams' ? 'all workspaces' : `${teamFilter} workspace`}...
            </p>
          </div>
          <button onclick={() => isAiCollapsed = true} class="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Collapse">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <div class="flex justify-end">
            <div class="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
              <p class="text-[13px] text-gray-900">We're seeing duplicate intake entries between Epic and the referral system.</p>
            </div>
          </div>
          <div class="flex justify-start">
            <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p class="text-[13px] text-gray-900">Would you classify this as operational inefficiency or system integration gap?</p>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
              <p class="text-[13px] text-gray-900">System integration gap</p>
            </div>
          </div>
          <div class="bg-white border-2 border-[#6B9695] rounded-xl p-4 w-full">
            <div class="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span class="text-[11px] text-[#6B9695] font-semibold uppercase tracking-wide">Structured Preview</span>
            </div>
            <div class="space-y-2 mb-4">
              <div>
                <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Title</p>
                <p class="text-[13px] text-gray-900 font-semibold">Intake Form Duplication</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Summary</p>
                <p class="text-[12px] text-gray-700">Manual re-entry across EHR systems</p>
              </div>
              <div class="flex gap-3">
                <div>
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Value</p>
                  <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium bg-red-50 text-red-700 border-red-200">High</span>
                </div>
                <div>
                  <p class="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Viability</p>
                  <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium bg-blue-50 text-blue-700 border-blue-200">Medium</span>
                </div>
              </div>
              <div class="pt-2 border-t border-gray-100">
                <p class="text-[11px] text-gray-600 font-medium">Similarity: <span class="text-[#6B9695] font-semibold">87%</span> to "EHR Data Sync Delays"</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick={() => showAddModal = true}
                class="flex-1 px-3 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors">
                Create Use Case Card
              </button>
              <button class="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors">
                Refine
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200">
          <div class="flex gap-2">
            <input type="text" placeholder="Describe a use case..." bind:value={aiInput}
              class="flex-1 px-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
            <button class="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors">Send</button>
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
{#if showAddModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-[16px] text-gray-900 font-semibold">Add Use Case</h3>
        <button onclick={() => showAddModal = false} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="uc-title" class="block text-[13px] text-gray-700 font-medium mb-1.5">Title</label>
          <input id="uc-title" type="text" bind:value={newTitle} placeholder="e.g. Intake form duplication"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
        </div>
        <div>
          <label for="uc-summary" class="block text-[13px] text-gray-700 font-medium mb-1.5">Summary</label>
          <textarea id="uc-summary" bind:value={newSummary} rows="2" placeholder="Brief description of the issue..."
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none placeholder:text-gray-400"></textarea>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="uc-value" class="block text-[12px] text-gray-600 font-medium mb-1">Value</label>
            <select id="uc-value" bind:value={newValue} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <label for="uc-viability" class="block text-[12px] text-gray-600 font-medium mb-1">Viability</label>
            <select id="uc-viability" bind:value={newViability} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <label for="uc-visibility" class="block text-[12px] text-gray-600 font-medium mb-1">Visibility</label>
            <select id="uc-visibility" bind:value={newVisibility} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>Internal</option><option>Restricted</option><option>Cross-Silo</option>
            </select>
          </div>
        </div>
        {#if me}
          <p class="text-[12px] text-gray-500">Adding as <span class="font-medium text-gray-700">{me.name}</span> — {teamForParticipant(me.id)?.name ?? 'no team'}</p>
        {/if}
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick={() => showAddModal = false}
          class="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
          Cancel
        </button>
        <button onclick={addUseCase} disabled={addingUseCase || !newTitle.trim()}
          class="flex-1 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {addingUseCase ? 'Adding...' : 'Add Use Case'}
        </button>
      </div>
    </div>
  </div>
{/if}
