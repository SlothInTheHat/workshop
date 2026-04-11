<script lang="ts">
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import type { UseCase, Insight, Participant } from '$lib/workshop/types';

  let { data }: { data: PageData } = $props();

  const workshopId = $derived($page.params.workshopId);

  type Tab = 'round1' | 'round2' | 'executive';
  let activeTab = $state<Tab>('round1');
  let generatingInsights = $state(false);

  let usecases = $state<UseCase[]>(data.usecases ?? []);
  let insights = $state<Insight[]>(data.insights ?? []);
  let participants = $state<Participant[]>(data.participants ?? []);
  let me = $state<Participant | null>(data.me ?? null);

  const workshop = $derived(data.workshop);

  // Sort use cases by upvotes descending for round 2
  const sortedUsecases = $derived([...usecases].sort((a, b) => b.upvotes - a.upvotes));

  async function handleUpvote(usecaseId: string) {
    if (!me) return;
    const uc = usecases.find(u => u.id === usecaseId);
    if (uc?.upvotedBy?.includes(me.id)) return; // already voted
    const res = await fetch(`/api/workshop/${workshopId}/usecases/${usecaseId}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: me.id }),
    });
    if (res.ok) {
      const { upvotes } = await res.json();
      usecases = usecases.map(u => u.id === usecaseId
        ? { ...u, upvotes, upvotedBy: [...(u.upvotedBy ?? []), me!.id] }
        : u
      );
    }
  }

  async function generateInsights() {
    generatingInsights = true;
    const res = await fetch(`/api/workshop/${workshopId}/insights/generate`, { method: 'POST' });
    if (res.ok) {
      const result = await res.json();
      insights = result.insights ?? [];
    }
    generatingInsights = false;
  }

  const difficultyColor = (d: string) => {
    if (d === 'Low') return 'bg-green-50 text-green-700 border-green-200';
    if (d === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const valueColor = (v: string) =>
    v === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
    v === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-gray-50 text-gray-600 border-gray-200';

  const viabilityColor = (v: string) =>
    v === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    v === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-gray-50 text-gray-600 border-gray-200';

  const totalVotes = $derived(usecases.reduce((s, u) => s + u.upvotes, 0));
  const myVoteCount = $derived(usecases.filter(u => u.upvotedBy?.includes(me?.id ?? '')).length);

  const strategicPillars = [
    'Operational Efficiency', 'Patient Experience',
    'Clinical Workflow Optimization', 'Data Interoperability',
  ];
</script>

<div class="min-h-screen bg-gray-50 flex flex-col" style="font-family: Inter, sans-serif;">

  <!-- Header -->
  <div class="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <a href="/" class="text-[16px] font-bold text-gray-900 tracking-tight hover:opacity-80">optura</a>
          <span class="text-gray-300">|</span>
          <h1 class="text-gray-900 font-semibold text-[18px]">{workshop?.title ?? 'Workshop'}</h1>
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-gray-600 bg-gray-100 font-medium text-[12px]">Completed</span>
        </div>
        <a href="/" class="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px] font-medium">
          Back to Workshops
        </a>
      </div>

      <!-- Tabs -->
      <div class="flex gap-3">
        {#each [
          { id: 'round1', label: 'Round 1 – Blind Voting', num: 1 },
          { id: 'round2', label: 'Round 2 – Results', num: 2 },
          { id: 'executive', label: 'Executive Summary', num: 3 },
        ] as tab}
          <button onclick={() => activeTab = tab.id as Tab}
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors text-[13px] font-medium {activeTab === tab.id ? 'bg-[#6B9695] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            <span class="flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold {activeTab === tab.id ? 'bg-white text-[#6B9695]' : 'bg-white text-gray-600'}">
              {tab.num}
            </span>
            {tab.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex-1 px-8 py-6">
    <div class="max-w-5xl mx-auto">

      <!-- Round 1 — Blind Voting -->
      {#if activeTab === 'round1'}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-blue-900 font-semibold text-[14px]">Blind voting in progress</span>
            <span class="text-blue-700 font-medium text-[13px]">{myVoteCount} / {usecases.length} votes cast by you</span>
          </div>
          <div class="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: {usecases.length ? Math.round((myVoteCount / usecases.length) * 100) : 0}%"></div>
          </div>
          <p class="text-blue-700 text-[12px]">Vote totals are hidden until Round 2. Click upvote to support an idea.</p>
        </div>

        <h2 class="text-gray-900 font-semibold text-[20px] mb-5">Round 1 — Blind Crowd Voting</h2>
        <div class="space-y-4">
          {#each usecases as uc}
            <div class="bg-white rounded-lg border border-gray-200 p-5" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="text-gray-900 font-semibold text-[15px] mb-2">{uc.title}</h3>
                  <div class="flex items-center gap-1.5 mb-3 text-gray-500 text-[13px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {uc.addedBy}
                  </div>
                  <p class="text-gray-600 text-[13px] leading-relaxed">{uc.summary}</p>
                </div>
                <button onclick={() => handleUpvote(uc.id)}
                  class="flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-[13px] font-medium shrink-0 {uc.upvotedBy?.includes(me?.id ?? '') ? 'bg-[#6B9695] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                  {uc.upvotedBy?.includes(me?.id ?? '') ? 'Voted' : 'Upvote'}
                </button>
              </div>
            </div>
          {/each}
        </div>

      <!-- Round 2 — Voting Results -->
      {:else if activeTab === 'round2'}
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p class="text-purple-900 font-semibold text-[14px] mb-1">Voting Results Revealed</p>
          <p class="text-purple-700 text-[12px]">{totalVotes} total votes across {usecases.length} use cases.</p>
        </div>

        <h2 class="text-gray-900 font-semibold text-[20px] mb-5">Round 2 — Voting Results</h2>
        <div class="space-y-4">
          {#each sortedUsecases as uc, i}
            <div class="bg-white rounded-lg border border-gray-200 p-5" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div class="flex items-start gap-4">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 {i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}">
                  {i + 1}
                </div>
                <div class="flex-1">
                  <h3 class="text-gray-900 font-semibold text-[15px] mb-1">{uc.title}</h3>
                  <div class="flex items-center gap-1.5 mb-2 text-gray-500 text-[13px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {uc.addedBy}
                  </div>
                  <p class="text-gray-600 text-[13px] leading-relaxed mb-3">{uc.summary}</p>
                  <div class="flex gap-1.5">
                    <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {valueColor(uc.value)}">Value: {uc.value}</span>
                    <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {viabilityColor(uc.viability)}">Viability: {uc.viability}</span>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-4">
                  <div class="text-gray-400 text-[11px] mb-0.5">Votes</div>
                  <div class="text-gray-900 font-bold text-[32px] leading-none">{uc.upvotes}</div>
                  {#if totalVotes > 0}
                    <div class="text-gray-400 text-[11px] mt-0.5">{Math.round((uc.upvotes / totalVotes) * 100)}%</div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

      <!-- Executive Summary -->
      {:else}
        <div class="space-y-8">
          <div class="flex items-center justify-between">
            <h2 class="text-gray-900 font-semibold text-[20px]">Executive Workshop Summary</h2>
            <div class="flex gap-2">
              <button onclick={generateInsights} disabled={generatingInsights}
                class="flex items-center gap-2 px-4 py-2 border border-[#6B9695] text-[#6B9695] hover:bg-[#F0F9F9] rounded-md transition-colors text-[13px] font-medium disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {generatingInsights ? 'Generating...' : 'Generate Insights'}
              </button>
              <button class="flex items-center gap-2 px-4 py-2 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px] font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Executive Report
              </button>
            </div>
          </div>

          <!-- Workshop Context -->
          <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h3 class="text-gray-900 font-semibold text-[16px] mb-5">Workshop Context</h3>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <h4 class="text-gray-900 font-semibold text-[13px] mb-1">Workshop</h4>
                <p class="text-gray-600 text-[13px]">{workshop?.title}</p>
              </div>
              <div>
                <h4 class="text-gray-900 font-semibold text-[13px] mb-1">Client</h4>
                <p class="text-gray-600 text-[13px]">{workshop?.client}</p>
              </div>
              <div>
                <h4 class="text-gray-900 font-semibold text-[13px] mb-1">Participants</h4>
                <div class="flex flex-wrap gap-1.5">
                  {#each participants as p}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
                      <div class="w-3 h-3 rounded-full {p.color}"></div>
                      {p.name}
                    </span>
                  {/each}
                </div>
              </div>
              <div>
                <h4 class="text-gray-900 font-semibold text-[13px] mb-1">Use Cases</h4>
                <p class="text-gray-600 text-[13px]">{usecases.length} submitted · {totalVotes} total votes</p>
              </div>
            </div>
          </div>

          <!-- Top Opportunities (from insights or top-voted usecases) -->
          <div>
            <h3 class="text-gray-900 font-semibold text-[16px] mb-4">Top Opportunities Identified</h3>
            {#if insights.length > 0}
              <div class="space-y-4">
                {#each insights.slice(0, 5) as insight, i}
                  <div class="bg-white rounded-lg border-l-4 border-l-[#6B9695] border border-gray-200 p-5" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div class="flex items-start gap-4">
                      <div class="w-7 h-7 rounded-full bg-[#6B9695] text-white flex items-center justify-center text-[13px] font-bold shrink-0">{i + 1}</div>
                      <div class="flex-1">
                        <h4 class="text-gray-900 font-semibold text-[15px] mb-1">{insight.title}</h4>
                        <div class="flex items-center gap-1.5 mb-2 text-gray-500 text-[13px]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {insight.addedBy}
                        </div>
                        <p class="text-gray-600 text-[13px] leading-relaxed mb-3">{insight.summary}</p>
                        <div class="flex flex-wrap gap-1.5 mb-3">
                          <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {valueColor(insight.value)}">Value: {insight.value}</span>
                          <span class="px-2 py-0.5 rounded-md text-[10px] border font-medium {viabilityColor(insight.viability)}">Viability: {insight.viability}</span>
                          {#each insight.tags.filter(t => !['High','Medium','Low','Internal','Restricted','Cross-Silo'].includes(t)) as tag}
                            <span class="px-2 py-0.5 rounded-md text-[10px] bg-[#F0F9F9] text-[#6B9695] border border-[#6B9695]/20 font-medium">{tag}</span>
                          {/each}
                        </div>
                        {#if insight.similarityScore && insight.similarTo}
                          <p class="text-[12px] text-gray-500">
                            Similarity: <span class="text-[#6B9695] font-semibold">{insight.similarityScore}%</span> to "{insight.similarTo}"
                          </p>
                        {/if}
                      </div>
                      <div class="text-right shrink-0">
                        <div class="text-gray-400 text-[11px] mb-0.5">Votes</div>
                        <div class="text-gray-900 font-bold text-[24px] leading-none">{insight.upvotes}</div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <svg class="mx-auto mb-3 text-gray-300" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <p class="text-gray-500 text-[14px] mb-3">No insights generated yet.</p>
                <button onclick={generateInsights} disabled={generatingInsights}
                  class="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50">
                  {generatingInsights ? 'Generating...' : 'Generate Insights Now'}
                </button>
              </div>
            {/if}
          </div>

          <!-- Strategic Alignment -->
          <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h3 class="text-gray-900 font-semibold text-[16px] mb-3">Alignment with Strategic Pillars</h3>
            <p class="text-gray-600 text-[13px] leading-relaxed mb-4">The identified opportunities align with the following strategic pillars:</p>
            <div class="flex flex-wrap gap-3">
              {#each strategicPillars as pillar}
                <button class="inline-flex items-center px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors text-[13px] font-medium">{pillar}</button>
              {/each}
            </div>
          </div>

          <!-- Quick Wins -->
          {#if insights.filter(i => i.viability === 'High').length > 0}
            <div>
              <h3 class="text-gray-900 font-semibold text-[16px] mb-4">High-Viability Quick Wins</h3>
              <div class="space-y-3">
                {#each insights.filter(i => i.viability === 'High').slice(0, 4) as insight}
                  <div class="bg-white rounded-lg border border-gray-200 p-4" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <h4 class="text-gray-900 font-semibold text-[14px] mb-1">{insight.title}</h4>
                        <p class="text-gray-500 text-[12px]">{insight.summary}</p>
                      </div>
                      <span class="px-3 py-1 rounded-md border text-[12px] font-medium shrink-0 {difficultyColor('Low')}">High Viability</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Value vs Viability Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h3 class="text-gray-900 font-semibold text-[16px] mb-4">Value vs. Viability Matrix</h3>
            <div class="relative border border-gray-200 rounded-lg overflow-hidden" style="height: 280px; background: #FAFAF9;">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] text-gray-400 font-medium whitespace-nowrap">Business Value ↑</div>
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-gray-400 font-medium">Implementation Viability →</div>
              <!-- Quadrant dividers -->
              <div class="absolute inset-0 flex"><div class="flex-1 border-r border-gray-200"></div><div class="flex-1"></div></div>
              <div class="absolute inset-0 flex flex-col"><div class="flex-1 border-b border-gray-200"></div><div class="flex-1"></div></div>
              <!-- Quadrant labels -->
              <span class="absolute top-3 left-10 text-[10px] text-gray-300 font-medium">Ambitious</span>
              <span class="absolute top-3 right-4 text-[10px] text-gray-300 font-medium">Quick Wins</span>
              <span class="absolute bottom-8 left-10 text-[10px] text-gray-300 font-medium">Low Priority</span>
              <span class="absolute bottom-8 right-4 text-[10px] text-gray-300 font-medium">Easy Gains</span>
              <!-- Dots for each use case -->
              {#each usecases as uc, i}
                {@const xPct = uc.viability === 'High' ? 65 + (i % 3) * 8 : uc.viability === 'Medium' ? 40 + (i % 3) * 5 : 15 + (i % 3) * 5}
                {@const yPct = uc.value === 'High' ? 15 + (i % 3) * 6 : uc.value === 'Medium' ? 42 + (i % 3) * 5 : 65 + (i % 3) * 5}
                <div class="absolute group" style="left: {xPct}%; top: {yPct}%; transform: translate(-50%, -50%);">
                  <div class="w-3.5 h-3.5 rounded-full cursor-pointer hover:scale-150 transition-transform bg-[#6B9695] border-2 border-white shadow-sm"></div>
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium z-10">
                    {uc.title}
                  </div>
                </div>
              {/each}
            </div>
          </div>

        </div>
      {/if}
    </div>
  </div>
</div>
