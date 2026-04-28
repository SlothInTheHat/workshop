<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const { workshop, teams, participants, useCaseCount } = $derived(data);
  const workshopId = 'workshop-1';

  let searchQuery = $state('');

  const statusColor = (status: string) => {
    if (status === 'live') return 'bg-[#D1FAE5] text-[#065F46]';
    if (status === 'setup') return 'bg-blue-50 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: string) => {
    if (status === 'live') return 'Live';
    if (status === 'setup') return 'Setup';
    return 'Completed';
  };
</script>

<div class="bg-[#f5f5f0] min-h-screen" style="font-family: Inter, sans-serif;">
  <div class="bg-white border-b border-gray-200 px-8 py-4">
    <div class="max-w-7xl mx-auto grid grid-cols-3 gap-4">
      {#each [
        { icon: 'activity', label: 'Active Workshops', value: workshop?.status === 'live' ? '1' : '0' },
        { icon: 'users', label: 'Total Participants', value: String(participants?.length ?? 0) },
        { icon: 'lightbulb', label: 'Use Cases Submitted', value: String(useCaseCount ?? 0) },
      ] as stat}
        <div class="bg-[#FAFAF9] rounded-md border border-gray-200 p-4 flex items-center gap-3" style="box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div class="text-gray-400">
            {#if stat.icon === 'activity'}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            {:else if stat.icon === 'users'}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            {/if}
          </div>
          <div>
            <p class="text-[11px] text-gray-500 mb-0.5">{stat.label}</p>
            <p class="text-xl text-gray-900 font-semibold">{stat.value}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-8 py-8">
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl text-gray-900 mb-2 font-bold">Workshop Mode</h1>
          {#if workshop?.client}
            <p class="text-[14px] text-gray-600">{workshop.client}</p>
          {/if}
        </div>
        <div class="flex items-center gap-3">
          <a
            href="/workshops/new"
            class="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[14px] font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Workshop
          </a>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search workshops..." bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
        </div>
        <button class="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[14px] font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter
        </button>
      </div>
    </div>

    {#if workshop}
      <div class="space-y-8">
        <div>
          <h2 class="text-[13px] text-gray-500 uppercase tracking-wide mb-4 font-semibold">
            {teams?.[0]?.name ? 'Active' : 'Workshops'}
          </h2>
          <div class="grid grid-cols-1 gap-4">
            <div class="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <div class="space-y-5">
                <h2 class="text-2xl text-gray-900 font-bold">{workshop.title}</h2>
                <div class="space-y-2.5">
                  <div class="flex items-center">
                    <span class="text-[12px] text-gray-500 min-w-[120px]">Client</span>
                    <span class="text-[12px] text-gray-700">{workshop.client}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-[12px] text-gray-500 min-w-[120px]">Status</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium {statusColor(workshop.status)}">
                      {statusLabel(workshop.status)}
                    </span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-[12px] text-gray-500 min-w-[120px]">Participants</span>
                    <div class="flex items-center gap-2">
                      <div class="flex -space-x-1">
                        {#each participants ?? [] as p}
                          <div class="w-6 h-6 rounded-full {p.color} border-2 border-white flex items-center justify-center text-[9px] text-white font-semibold" title={p.name}>
                            {p.initials}
                          </div>
                        {/each}
                      </div>
                      <span class="text-[12px] text-gray-600">{participants?.length ?? 0} people</span>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <span class="text-[12px] text-gray-500 min-w-[120px]">Teams</span>
                    <div class="flex gap-1.5 flex-wrap">
                      {#each (teams ?? []).slice(0, 2) as team}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium whitespace-nowrap">{team.name}</span>
                      {/each}
                    </div>
                  </div>
                  <div class="flex items-center">
                    <span class="text-[12px] text-gray-500 min-w-[120px]">Use Cases</span>
                    <span class="text-[12px] text-gray-700">{useCaseCount} submitted</span>
                  </div>
                </div>
                <div class="border-t border-gray-100 pt-5"></div>
                <div class="flex items-center gap-2.5">
                  <a href="/workshop/{workshopId}/live"
                    class="px-4 py-2 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px] font-medium">
                    Enter Workshop
                  </a>
                  <a href="/workshops/{workshopId}/post"
                    class="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px] font-medium">
                    Post Workshop
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-gray-500 text-[14px]">No workshops found.</div>
    {/if}
  </div>
</div>
