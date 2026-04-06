<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const workshopId = $derived($page.params.workshopId);

  type ViewMode = 'individual' | 'workshop-wide';
  type TeamFilter = 'Mine' | 'Team A' | 'Team B' | 'All Teams';
  type RatingLevel = 'High' | 'Medium' | 'Low';
  type Visibility = 'Internal' | 'Restricted' | 'Cross-Silo';

  interface UsecaseCard {
    id: string;
    title: string;
    summary: string;
    value: RatingLevel;
    viability: RatingLevel;
    visibility: Visibility;
    addedBy: string;
    timestamp: string;
    position: { x: number; y: number };
    clusterId?: number;
    upvotes: number;
    comments: number;
    team?: string;
    collaborators?: string[];
    crossTeamOverlap?: string;
  }

  let viewMode = $state<ViewMode>('individual');
  let teamFilter = $state<TeamFilter>('Mine');
  let isAiCollapsed = $state(false);
  let isNavCollapsed = $state(false);
  let zoom = $state(1);
  let aiInput = $state('');
  let selectedCluster = $state<number | null>(null);
  let showAddModal = $state(false);

  // New use case form state
  let newTitle = $state('');
  let newSummary = $state('');
  let newValue = $state<RatingLevel>('High');
  let newViability = $state<RatingLevel>('Medium');
  let newVisibility = $state<Visibility>('Internal');

  const agendaItems = [
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
    { name: 'Team A', members: ['Dr. Sarah Chen', 'Jamie Liu'], activeCount: 2 },
    { name: 'Team B', members: ['Michael Torres'], activeCount: 1 },
  ];

  let cards = $state<UsecaseCard[]>([
    { id: '1', title: 'Intake form duplication', summary: 'Multiple manual re-entry points across EHR systems', value: 'High', viability: 'Medium', visibility: 'Internal', addedBy: 'Dr. Sarah Chen', timestamp: '2m ago', position: { x: 80, y: 60 }, clusterId: 1, upvotes: 3, comments: 2, team: 'Team A', collaborators: ['Dr. Sarah Chen', 'Jamie Liu'], crossTeamOverlap: 'Team B' },
    { id: '2', title: 'Insurance verification lag', summary: 'Manual insurance checks delay intake by 24-48 hours', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: 'Dr. Sarah Chen', timestamp: '15m ago', position: { x: 420, y: 80 }, clusterId: 2, upvotes: 5, comments: 1, team: 'Team A', collaborators: ['Dr. Sarah Chen'] },
    { id: 'w2', title: 'EHR data sync delays', summary: 'Patient data not syncing in real-time between systems', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', addedBy: 'Michael Torres', timestamp: '5m ago', position: { x: 290, y: 60 }, clusterId: 1, upvotes: 7, comments: 3, team: 'Team B', collaborators: ['Michael Torres'] },
    { id: 'w3', title: 'Duplicate patient records', summary: 'Cross-system duplicates causing clinical confusion and delays', value: 'High', viability: 'Low', visibility: 'Cross-Silo', addedBy: 'Jamie Liu', timestamp: '18m ago', position: { x: 170, y: 220 }, clusterId: 1, upvotes: 4, comments: 1, team: 'Team A', collaborators: ['Jamie Liu'] },
    { id: 'w4', title: 'Manual fax processing', summary: 'Prior auth requests require manual fax review', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: 'Jamie Liu', timestamp: '12m ago', position: { x: 600, y: 70 }, clusterId: 2, upvotes: 8, comments: 2, team: 'Team A', collaborators: ['Jamie Liu'] },
    { id: 'w5', title: 'Referral letter generation', summary: 'Physicians spending 20 min per referral on paperwork', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: 'Michael Torres', timestamp: '22m ago', position: { x: 700, y: 200 }, clusterId: 2, upvotes: 6, comments: 4, team: 'Team B', collaborators: ['Michael Torres'] },
    { id: 'w7', title: 'Scheduling conflicts', summary: 'No real-time visibility across department schedules', value: 'Medium', viability: 'High', visibility: 'Internal', addedBy: 'Michael Torres', timestamp: '8m ago', position: { x: 80, y: 420 }, clusterId: 3, upvotes: 2, comments: 0, team: 'Team B', collaborators: ['Michael Torres'] },
    { id: 'w8', title: 'Care coordination gaps', summary: 'Post-discharge follow-up falls through the cracks', value: 'High', viability: 'Medium', visibility: 'Cross-Silo', addedBy: 'Jamie Liu', timestamp: '25m ago', position: { x: 310, y: 400 }, clusterId: 3, upvotes: 9, comments: 3, team: 'Team A', collaborators: ['Jamie Liu'] },
    { id: 'w9', title: 'Fragmented care notes', summary: 'Clinical notes scattered across 3 separate platforms', value: 'High', viability: 'Medium', visibility: 'Restricted', addedBy: 'Dr. Sarah Chen', timestamp: '30m ago', position: { x: 190, y: 540 }, clusterId: 3, upvotes: 4, comments: 2, team: 'Team A', collaborators: ['Dr. Sarah Chen', 'Jamie Liu'] },
  ]);

  const workshopClusters = [
    { id: 1, label: 'Integration Issues', count: 3, color: 'rgba(107,150,149,0.08)', borderColor: 'rgba(107,150,149,0.3)', labelColor: '#6B9695', rect: { x: 30, y: 30, w: 540, h: 290 } },
    { id: 2, label: 'Documentation Automation', count: 3, color: 'rgba(99,179,135,0.08)', borderColor: 'rgba(99,179,135,0.3)', labelColor: '#38A169', rect: { x: 580, y: 30, w: 380, h: 290 } },
    { id: 3, label: 'Care Coordination', count: 3, color: 'rgba(99,122,179,0.08)', borderColor: 'rgba(99,122,179,0.3)', labelColor: '#5A6FBA', rect: { x: 30, y: 360, w: 540, h: 250 } },
  ];

  const getValueColor = (v: string) => {
    if (v === 'High') return 'bg-red-50 text-red-700 border-red-200';
    if (v === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getViabilityColor = (v: string) => {
    if (v === 'High') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (v === 'Medium') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getVisibilityColor = (v: string) => {
    if (v === 'Restricted') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (v === 'Cross-Silo') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const visibleCards = $derived(() => {
    if (viewMode === 'workshop-wide') return cards;
    if (teamFilter === 'Mine') return cards.filter(c => c.addedBy === 'Dr. Sarah Chen');
    if (teamFilter === 'All Teams') return cards;
    return cards.filter(c => c.team === teamFilter);
  });

  function handleUpvote(id: string) {
    cards = cards.map(c => c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c);
  }

  function switchView(mode: ViewMode) {
    viewMode = mode;
    if (mode === 'workshop-wide') {
      zoom = 0.65;
      teamFilter = 'All Teams';
    } else {
      zoom = 1;
      teamFilter = 'Mine';
    }
  }

  function addUseCase() {
    if (!newTitle.trim()) return;
    const newCard: UsecaseCard = {
      id: `new-${Date.now()}`,
      title: newTitle,
      summary: newSummary,
      value: newValue,
      viability: newViability,
      visibility: newVisibility,
      addedBy: 'Dr. Sarah Chen',
      timestamp: 'Just now',
      position: { x: 80 + Math.random() * 200, y: 60 + Math.random() * 100 },
      clusterId: 1,
      upvotes: 0,
      comments: 0,
      team: 'Team A',
      collaborators: ['Dr. Sarah Chen'],
    };
    cards = [...cards, newCard];
    newTitle = '';
    newSummary = '';
    newValue = 'High';
    newViability = 'Medium';
    newVisibility = 'Internal';
    showAddModal = false;
  }

  const workspaceLabel = $derived(() => {
    if (teamFilter === 'Mine') return 'My Workspace';
    if (teamFilter === 'All Teams') return 'All Workspaces';
    return `${teamFilter} Workspace`;
  });

  const collaboratorsLabel = $derived(() => {
    if (teamFilter === 'Team A') return 'Active collaborators: Sarah, Jamie';
    if (teamFilter === 'Team B') return 'Active collaborators: Michael';
    return 'Your personal workspace';
  });
</script>

<div class="h-screen flex flex-col bg-[#FAFAF9] overflow-hidden" style="font-family: Inter, sans-serif;">
  <!-- Top Nav Bar -->
  <div class="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30">
    <div class="flex items-center gap-3">
      <a href="/" class="text-[16px] font-bold text-gray-900 tracking-tight hover:opacity-80">optura</a>
      <span class="text-gray-300">|</span>
      <span class="text-[13px] text-gray-700 font-medium">Oncology Intake Redesign</span>
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#D1FAE5] text-[#065F46] font-medium">Live</span>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center gap-0.5 bg-[#F5F5F5] border border-gray-200 rounded-lg p-0.5">
        <button
          onclick={() => switchView('individual')}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-all font-medium {viewMode === 'individual' ? 'bg-[#6B9695] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My View
        </button>
        <button
          onclick={() => switchView('workshop-wide')}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-all font-medium {viewMode === 'workshop-wide' ? 'bg-[#6B9695] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Workshop View
        </button>
      </div>

      {#if viewMode === 'individual'}
        <div class="relative flex items-center gap-1.5 bg-[#F5F5F5] border border-gray-200 rounded-lg px-3 py-1.5">
          <span class="text-[11px] text-gray-600 font-medium">View:</span>
          <select
            bind:value={teamFilter}
            class="bg-transparent text-[12px] text-gray-700 font-medium cursor-pointer focus:outline-none appearance-none pr-4"
          >
            <option value="Mine">Mine</option>
            <option value="Team A">Team A</option>
            <option value="Team B">Team B</option>
            <option value="All Teams">All Teams</option>
          </select>
          <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <button onclick={() => showAddModal = true} class="flex items-center gap-1.5 px-3 py-1.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Use Case
      </button>
      <button onclick={() => goto(`/workshop/${workshopId}/summary`)} class="px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-900 rounded-lg text-[12px] font-medium transition-colors">
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
            {#each agendaItems as item}
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
                <div class="w-6 h-6 rounded-full {p.color} flex items-center justify-center text-[10px] text-white font-semibold shrink-0">
                  {p.initials}
                </div>
                <div class="min-w-0">
                  <p class="text-[12px] text-gray-900 font-medium truncate">{p.isMe ? 'You' : p.name.split(' ')[1]}</p>
                  <p class="text-[10px] text-gray-400">{p.presence}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Breakout Teams -->
        <div class="p-4">
          <h3 class="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Breakout Teams</h3>
          <div class="space-y-3">
            {#each breakoutTeams as team}
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[12px] text-gray-900 font-semibold">{team.name}</span>
                  <span class="text-[10px] text-green-600 font-medium">● {team.activeCount} Active</span>
                </div>
                <div class="space-y-1">
                  {#each team.members as member}
                    <p class="text-[11px] text-gray-600">• {member}</p>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Main Canvas -->
    <div class="flex-1 relative overflow-hidden bg-[#FAFAF9]" style="background-image: linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px); background-size: 40px 40px;">

      <!-- Workspace Header Bar -->
      {#if viewMode === 'individual' && teamFilter !== 'All Teams'}
        <div class="absolute top-4 left-4 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2.5">
          <div class="flex items-center justify-between gap-8">
            <div>
              <h2 class="text-[13px] text-gray-900 font-semibold">{workspaceLabel()}</h2>
              <p class="text-[11px] text-gray-500">{collaboratorsLabel()}</p>
            </div>
          </div>
        </div>
      {/if}

      {#if viewMode === 'workshop-wide'}
        <!-- Workshop-wide banner -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div class="flex items-center gap-2 px-4 py-2 bg-[#1E2A38] text-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="text-[12px] font-medium">Workshop Overview — Oncology Intake Redesign</span>
            <span class="text-[11px] text-gray-400 ml-2">3 participants · {cards.length} usecases · 3 themes</span>
          </div>
        </div>
      {/if}

      <!-- Canvas content with zoom -->
      <div
        class="absolute inset-0 pt-20"
        style="transform: scale({zoom}); transform-origin: 0 0;"
      >
        <!-- Cluster backgrounds (workshop view only) -->
        {#if viewMode === 'workshop-wide'}
          {#each workshopClusters as cluster}
            <div
              class="absolute rounded-2xl transition-all duration-200 cursor-pointer"
              style="
                left: {cluster.rect.x}px;
                top: {cluster.rect.y}px;
                width: {cluster.rect.w}px;
                height: {cluster.rect.h}px;
                background: {selectedCluster === cluster.id ? cluster.color.replace('0.08', '0.14') : cluster.color};
                border: 1.5px dashed {cluster.borderColor};
                opacity: {selectedCluster !== null && selectedCluster !== cluster.id ? 0.4 : 1};
              "
              onclick={() => selectedCluster = selectedCluster === cluster.id ? null : cluster.id}
            >
              <div class="absolute -top-5 left-3">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style="
                    background: {selectedCluster === cluster.id ? cluster.labelColor : 'white'};
                    color: {selectedCluster === cluster.id ? 'white' : cluster.labelColor};
                    border: 1.5px solid {cluster.borderColor};
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                  "
                >
                  {cluster.label}
                  <span class="text-[9px] px-1 rounded-full" style="background: rgba(255,255,255,0.25);">{cluster.count}</span>
                </span>
              </div>
            </div>
          {/each}
        {/if}

        <!-- Use case cards -->
        {#each visibleCards() as card (card.id)}
          {#if selectedCluster === null || card.clusterId === selectedCluster}
            <div
              class="absolute bg-white rounded-xl border border-gray-200 p-4 w-64 shadow-md hover:shadow-lg transition-shadow group"
              style="left: {card.position.x}px; top: {card.position.y}px;"
            >
              <!-- Team badge + AI icon row -->
              <div class="flex items-center justify-between mb-2">
                {#if card.team}
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                    {card.team}
                  </span>
                {:else}
                  <div></div>
                {/if}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>

              <h4 class="text-[13px] text-gray-900 font-semibold mb-1">{card.title}</h4>
              <p class="text-[12px] text-gray-600 mb-2.5 font-normal">{card.summary}</p>

              <!-- Collaborators -->
              {#if card.collaborators && card.collaborators.length > 0}
                <div class="mb-2 flex flex-wrap gap-1">
                  {#each card.collaborators as collab}
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 border border-gray-200">
                      👤 {collab.split(' ')[0]}
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
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border font-medium {getValueColor(card.value)}">Value: {card.value}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border font-medium {getViabilityColor(card.viability)}">Viability: {card.viability}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border font-medium {getVisibilityColor(card.visibility)}">{card.visibility}</span>
              </div>

              <!-- Interaction bar -->
              <div class="flex items-center justify-between pt-2 border-t border-gray-100 mb-1.5">
                <div class="flex items-center gap-1">
                  <button
                    onclick={() => handleUpvote(card.id)}
                    class="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-[10px] font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    {card.upvotes}
                  </button>
                  <button class="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-[10px] font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {card.comments}
                  </button>
                </div>
                <button class="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F0F9F9] text-[#6B9695] transition-colors text-[10px] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  AI
                </button>
              </div>

              <div class="flex items-center justify-between text-[10px] text-gray-400">
                <span>{card.addedBy}</span>
                <span>{card.timestamp}</span>
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Zoom Controls -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
        <button onclick={() => zoom = Math.max(zoom - 0.1, 0.3)} class="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <div class="px-2 text-[11px] text-gray-600 font-medium min-w-[50px] text-center">{Math.round(zoom * 100)}%</div>
        <button onclick={() => zoom = Math.min(zoom + 0.1, 2)} class="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
      </div>

      <!-- Sidebar collapse toggle -->
      <button
        onclick={() => isNavCollapsed = !isNavCollapsed}
        class="absolute top-4 {isNavCollapsed ? 'left-2' : 'left-2'} z-20 p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
        style="display: {viewMode === 'individual' ? 'block' : 'none'};"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>

    <!-- AI Analyst Panel -->
    {#if !isAiCollapsed}
      <div class="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
        <!-- AI Header -->
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <h3 class="text-[14px] text-gray-900 font-semibold">AI Analyst</h3>
            </div>
            <p class="text-[11px] text-gray-500">
              Analyzing {teamFilter === 'Mine' ? 'your workspace' : teamFilter === 'All Teams' ? 'all workspaces' : `${teamFilter} workspace`}...
            </p>
          </div>
          <button onclick={() => isAiCollapsed = true} class="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Chat Interface -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <!-- User message -->
          <div class="flex justify-end">
            <div class="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
              <p class="text-[13px] text-gray-900">We're seeing duplicate intake entries between Epic and the referral system.</p>
            </div>
          </div>
          <!-- AI response -->
          <div class="flex justify-start">
            <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p class="text-[13px] text-gray-900">Would you classify this as operational inefficiency or system integration gap?</p>
            </div>
          </div>
          <!-- User message -->
          <div class="flex justify-end">
            <div class="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
              <p class="text-[13px] text-gray-900">System integration gap</p>
            </div>
          </div>

          <!-- Structured Preview -->
          <div class="bg-white border-2 border-[#6B9695] rounded-xl p-4 w-full">
            <div class="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span class="text-[11px] text-[#6B9695] font-semibold uppercase tracking-wide">Structured Preview</span>
            </div>
            <div class="space-y-2 mb-4">
              <div>
                <p class="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Title</p>
                <p class="text-[13px] text-gray-900 font-semibold">Intake Form Duplication</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Summary</p>
                <p class="text-[12px] text-gray-700">Manual re-entry across EHR systems</p>
              </div>
              <div class="flex gap-3">
                <div>
                  <p class="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Value</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border font-medium bg-red-50 text-red-700 border-red-200">High</span>
                </div>
                <div>
                  <p class="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Viability</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border font-medium bg-blue-50 text-blue-700 border-blue-200">Medium</span>
                </div>
              </div>
              <div class="pt-2 border-t border-gray-200">
                <p class="text-[11px] text-gray-600 font-medium">Similarity: <span class="text-[#6B9695] font-semibold">87%</span> to "EHR Data Sync Delays"</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick={() => showAddModal = true} class="flex-1 px-3 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[12px] font-medium transition-colors">
                Create Use Case Card
              </button>
              <button class="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors">
                Refine
              </button>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-200">
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Describe a use case..."
              bind:value={aiInput}
              class="flex-1 px-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent"
            />
            <button class="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Collapsed AI Panel -->
      <button
        onclick={() => isAiCollapsed = false}
        class="w-10 bg-white border-l border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
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
        <button onclick={() => showAddModal = false} class="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-[13px] text-gray-700 font-medium mb-1.5">Title</label>
          <input type="text" bind:value={newTitle} placeholder="e.g. Intake form duplication" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
        </div>
        <div>
          <label class="block text-[13px] text-gray-700 font-medium mb-1.5">Summary</label>
          <textarea bind:value={newSummary} rows="2" placeholder="Brief description of the issue..." class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none placeholder:text-gray-400"></textarea>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-[12px] text-gray-600 font-medium mb-1">Value</label>
            <select bind:value={newValue} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <label class="block text-[12px] text-gray-600 font-medium mb-1">Viability</label>
            <select bind:value={newViability} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div>
            <label class="block text-[12px] text-gray-600 font-medium mb-1">Visibility</label>
            <select bind:value={newVisibility} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
              <option>Internal</option><option>Restricted</option><option>Cross-Silo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick={() => showAddModal = false} class="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">Cancel</button>
        <button onclick={addUseCase} class="flex-1 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors">Add Use Case</button>
      </div>
    </div>
  </div>
{/if}
