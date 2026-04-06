<script lang="ts">
  import { page } from '$app/stores';

  type Tab = 'round1' | 'round2' | 'executive';

  let activeTab = $state<Tab>('round1');
  let votedIds = $state<Set<string>>(new Set());

  const ideas = [
    {
      id: '1', title: 'Intake Auto-Validation', contributor: 'Andy',
      description: 'Automate the validation process for patient intake to reduce manual errors and improve efficiency.',
      votes: 85, rank: 1,
      whyItMatters: ['Reduces patient onboarding time by 40%, and minimizes manual data entry errors, directly supporting operational efficiency goals.'],
      difficulty: 'Low' as const, suggestedAgent: 'Intake Processing Agent',
    },
    {
      id: '2', title: 'Prior Authorization Automation', contributor: 'Jason',
      description: 'Streamline the prior authorization process by automating the submission and tracking of requests.',
      votes: 78, rank: 2,
      whyItMatters: ['Decreases authorization turnaround time by 60%, enabling faster treatment initiation and improved patient satisfaction.'],
      difficulty: 'Medium' as const, suggestedAgent: 'Authorization Workflow Agent',
    },
    {
      id: '3', title: 'EHR Data Standardization', contributor: 'Emily',
      description: 'Standardize the data format across the EHR system to improve data quality and interoperability.',
      votes: 72, rank: 3,
      whyItMatters: ['Enhances cross-departmental data consistency and supports better clinical decision-making through unified data.'],
      difficulty: 'High' as const, suggestedAgent: 'Data Harmonization Agent',
    },
    {
      id: '4', title: 'Appointment Scheduling Optimization', contributor: 'Maria',
      description: 'Optimize appointment scheduling to reduce wait times and improve resource utilization.',
      votes: 68, rank: 4,
      whyItMatters: ['Improves patient satisfaction by reducing wait times by 30%.'],
      difficulty: 'Low' as const, suggestedAgent: 'Scheduling Agent',
    },
  ];

  const difficultyColor = (d: string) => {
    if (d === 'Low') return 'bg-green-50 text-green-700 border-green-200';
    if (d === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  function toggleVote(id: string) {
    const next = new Set(votedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    votedIds = next;
  }

  const strategicPillars = [
    'Operational Efficiency',
    'Patient Experience',
    'Clinical Workflow Optimization',
    'Data Interoperability',
  ];
</script>

<div class="min-h-screen bg-gray-50 flex flex-col" style="font-family: Inter, sans-serif;">
  <!-- Page Header -->
  <div class="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <a href="/" class="text-[16px] font-bold text-gray-900 tracking-tight hover:opacity-80">optura</a>
          <span class="text-gray-300">|</span>
          <h1 class="text-gray-900 font-semibold text-[18px]">Workshop: Oncology Intake Redesign</h1>
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
          { id: 'round2', label: 'Round 2 – Voting Results', num: 2 },
          { id: 'executive', label: 'Executive Summary', num: 3 },
        ] as tab}
          <button
            onclick={() => activeTab = tab.id as Tab}
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors text-[13px] font-medium {activeTab === tab.id ? 'bg-[#6B9695] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            <span class="flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold {activeTab === tab.id ? 'bg-white text-[#6B9695]' : 'bg-white text-gray-600'}">
              {#if tab.id !== 'round1' && activeTab === 'executive' && tab.id === 'round1'}✓{:else}{tab.num}{/if}
            </span>
            {tab.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Tab Content -->
  <div class="flex-1 px-8 py-6">
    <div class="max-w-5xl mx-auto">

      <!-- Round 1 — Blind Voting -->
      {#if activeTab === 'round1'}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-blue-900 font-semibold text-[14px]">Blind voting in progress</span>
            <span class="text-blue-700 font-medium text-[13px]">{votedIds.size}/{ideas.length} votes submitted</span>
          </div>
          <div class="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: {Math.round((votedIds.size / ideas.length) * 100)}%"></div>
          </div>
          <p class="text-blue-700 text-[12px]">Vote totals are hidden until all participants submit their rankings.</p>
        </div>

        <h2 class="text-gray-900 font-semibold text-[20px] mb-5">Round 1 – Blind Crowd Voting</h2>

        <div class="space-y-4">
          {#each ideas as idea}
            <div class="bg-white rounded-lg border border-gray-200 p-5" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-gray-900 font-semibold text-[15px] mb-2">{idea.title}</h3>
                  <div class="flex items-center gap-1.5 mb-3 text-gray-500 text-[13px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {idea.contributor}
                  </div>
                  <p class="text-gray-600 text-[13px] leading-relaxed">{idea.description}</p>
                </div>
                <button
                  onclick={() => toggleVote(idea.id)}
                  class="flex items-center gap-2 px-4 py-2 rounded-md transition-colors ml-4 text-[13px] font-medium {votedIds.has(idea.id) ? 'bg-[#6B9695] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                  {votedIds.has(idea.id) ? 'Voted' : 'Upvote'}
                </button>
              </div>
            </div>
          {/each}
        </div>

      <!-- Round 2 — Voting Results -->
      {:else if activeTab === 'round2'}
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p class="text-purple-900 font-semibold text-[14px] mb-1">Voting Results Revealed</p>
          <p class="text-purple-700 text-[12px]">All votes have been submitted. Results are now visible to all participants.</p>
        </div>

        <h2 class="text-gray-900 font-semibold text-[20px] mb-5">Round 2 – Voting Results</h2>

        <div class="space-y-4">
          {#each ideas as idea}
            <div class="bg-white rounded-lg border border-gray-200 p-5" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-gray-900 font-semibold text-[15px] mb-2">{idea.title}</h3>
                  <div class="flex items-center gap-1.5 mb-3 text-gray-500 text-[13px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {idea.contributor}
                  </div>
                  <p class="text-gray-600 text-[13px] leading-relaxed">{idea.description}</p>
                </div>
                <div class="text-right ml-4 shrink-0">
                  <div class="text-gray-500 text-[11px] mb-1">Crowd Score</div>
                  <div class="text-gray-900 font-bold text-[32px] leading-none">{idea.votes}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>

      <!-- Executive Summary -->
      {:else}
        <div class="space-y-8">
          <!-- Header + Download -->
          <div class="flex items-center justify-between">
            <h2 class="text-gray-900 font-semibold text-[20px]">Executive Workshop Summary</h2>
            <button class="flex items-center gap-2 px-4 py-2 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px] font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Executive Report
            </button>
          </div>

          <!-- Workshop Context -->
          <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h3 class="text-gray-900 font-semibold text-[16px] mb-5">Workshop Context</h3>
            <div class="space-y-4">
              {#each [
                { label: 'Client Strategic Priorities', value: 'Optimize onboarding, patient experience optimization, clinical workflow enhancement, data interoperability improvements.' },
                { label: 'Workshop Objectives', value: 'Identify automation opportunities to streamline pre-visit patient intake and reduce administrative bottlenecks.' },
                { label: 'Key Workflow Areas Discussed', value: 'Oncology patient intake, prior authorization workflows, EHR data management systems.' },
              ] as section}
                <div>
                  <h4 class="text-gray-900 font-semibold text-[13px] mb-1">{section.label}</h4>
                  <p class="text-gray-600 text-[13px] leading-relaxed">{section.value}</p>
                </div>
              {/each}
            </div>
          </div>

          <!-- Top Opportunities -->
          <div>
            <h3 class="text-gray-900 font-semibold text-[16px] mb-4">Top Opportunities Identified</h3>
            <div class="space-y-4">
              {#each ideas.slice(0, 3) as idea}
                <div class="bg-white rounded-lg border border-gray-200 p-5 border-l-4 border-l-[#6B9695]" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  <div class="flex items-start gap-4">
                    <div class="w-7 h-7 rounded-full bg-[#6B9695] text-white flex items-center justify-center text-[14px] font-semibold shrink-0">
                      {idea.rank}
                    </div>
                    <div class="flex-1">
                      <h4 class="text-gray-900 font-semibold text-[15px] mb-2">{idea.title}</h4>
                      <div class="flex items-center gap-1.5 mb-3 text-gray-500 text-[13px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {idea.contributor}
                      </div>
                      <p class="text-gray-600 text-[13px] leading-relaxed mb-4">{idea.description}</p>
                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-blue-900 font-semibold text-[13px] mb-2">Why It Matters to the Client</p>
                        {#each idea.whyItMatters as point}
                          <p class="text-blue-800 text-[12px] leading-relaxed flex gap-2">
                            <span class="text-blue-600 mt-0.5 shrink-0">•</span>
                            {point}
                          </p>
                        {/each}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Strategic Alignment -->
          <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h3 class="text-gray-900 font-semibold text-[16px] mb-3">Alignment with Client Strategic Pillars</h3>
            <p class="text-gray-600 text-[13px] leading-relaxed mb-4">
              The identified opportunities align with the following strategic pillars defined during pre-workshop setup:
            </p>
            <div class="flex flex-wrap gap-3">
              {#each strategicPillars as pillar}
                <button class="inline-flex items-center px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors text-[13px] font-medium">
                  {pillar}
                </button>
              {/each}
            </div>
          </div>

          <!-- Quick Wins -->
          <div>
            <h3 class="text-gray-900 font-semibold text-[16px] mb-4">Fastest Opportunities Using Existing Optura Agents</h3>
            <div class="space-y-3">
              {#each ideas.filter(i => i.difficulty === 'Low' || i.difficulty === 'Medium') as idea}
                <div class="bg-white rounded-lg border border-gray-200 p-4" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <h4 class="text-gray-900 font-semibold text-[14px] mb-1">{idea.title}</h4>
                      <p class="text-gray-500 text-[12px]">Suggested agent: <span class="text-gray-700 font-medium">{idea.suggestedAgent}</span></p>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 rounded-md border text-[12px] font-medium shrink-0 {difficultyColor(idea.difficulty)}">{idea.difficulty} Difficulty</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Value vs Viability Chart -->
          <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h3 class="text-gray-900 font-semibold text-[16px] mb-4">Value vs. Viability</h3>
            <div class="relative border border-gray-200 rounded-lg overflow-hidden" style="height: 280px; background: #FAFAF9;">
              <!-- Axis labels -->
              <div class="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] text-gray-500 font-medium">Business Value</div>
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 font-medium">Implementation Viability</div>

              <!-- Quadrant lines -->
              <div class="absolute inset-0 flex">
                <div class="flex-1 border-r border-gray-200"></div>
                <div class="flex-1"></div>
              </div>
              <div class="absolute inset-0 flex flex-col">
                <div class="flex-1 border-b border-gray-200"></div>
                <div class="flex-1"></div>
              </div>

              <!-- Quadrant labels -->
              <span class="absolute top-4 left-12 text-[10px] text-gray-400">High Value / Low Viability</span>
              <span class="absolute top-4 right-6 text-[10px] text-gray-400">High Value / High Viability</span>
              <span class="absolute bottom-8 left-12 text-[10px] text-gray-400">Low Value / Low Viability</span>
              <span class="absolute bottom-8 right-6 text-[10px] text-gray-400">Low Value / High Viability</span>

              <!-- Idea dots -->
              {#each [
                { label: 'Intake Auto-Validation', x: 78, y: 20, color: '#6B9695' },
                { label: 'Prior Auth', x: 52, y: 32, color: '#5A6FBA' },
                { label: 'EHR Data', x: 30, y: 38, color: '#38A169' },
                { label: 'Scheduling', x: 65, y: 55, color: '#D97706' },
              ] as dot}
                <div
                  class="absolute group"
                  style="left: {dot.x}%; top: {dot.y}%; transform: translate(-50%, -50%);"
                >
                  <div class="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform" style="background: {dot.color};"></div>
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
                    {dot.label}
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
