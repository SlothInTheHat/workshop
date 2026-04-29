<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { session, workshops } = $derived(data);

  const isFacilitator = $derived(session?.role === 'facilitator');

  let searchQuery = $state('');

  const filtered = $derived(
    workshops.filter(w =>
      !searchQuery.trim() ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.focusArea ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const statusColor = (status: string) => {
    if (status === 'live') return 'bg-[#D1FAE5] text-[#065F46]';
    if (status === 'pre') return 'bg-blue-50 text-blue-700';
    if (status === 'completed') return 'bg-gray-100 text-gray-600';
    return 'bg-amber-50 text-amber-700';
  };

  const statusLabel = (status: string) => {
    if (status === 'live') return 'Live';
    if (status === 'pre') return 'Pre-Workshop';
    if (status === 'completed') return 'Completed';
    return 'Draft';
  };
</script>

<svelte:head>
  <title>Workshops — Optura</title>
</svelte:head>

<div class="bg-[#f5f5f0] min-h-screen" style="font-family: Inter, sans-serif;">
  <!-- Stats Strip -->
  <div class="bg-white border-b border-gray-200 px-8 py-4">
    <div class="max-w-7xl mx-auto grid grid-cols-3 gap-4">
      {#each [
        { icon: 'activity', label: 'Total Workshops', value: String(workshops.length) },
        { icon: 'users', label: 'In Pre-Workshop', value: String(workshops.filter(w => w.status === 'pre').length) },
        { icon: 'lightbulb', label: 'Live Now', value: String(workshops.filter(w => w.status === 'live').length) },
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

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl text-gray-900 mb-1 font-bold">Workshop Mode</h1>
          {#if session}
            <p class="text-[13px] text-gray-500">
              Signed in as <span class="font-medium text-gray-700">{session.name}</span>
              <span class="ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium {isFacilitator ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                {isFacilitator ? 'Facilitator' : 'Contributor'}
              </span>
            </p>
          {:else}
            <p class="text-[13px] text-gray-500">Create a workshop to get started, or <a href="/join" class="text-[#6B9695] font-medium hover:underline">join one with an access code</a>.</p>
          {/if}
        </div>
        <div class="flex items-center gap-3">
          {#if isFacilitator || !session}
            <a href="/workshops/new"
              class="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[14px] font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Workshop
            </a>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search workshops..." bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
        </div>
      </div>
    </div>

    <!-- Workshop List -->
    {#if workshops.length === 0}
      <div class="bg-white rounded-lg border border-gray-200 p-16 text-center">
        <p class="text-3xl mb-3">📋</p>
        <h3 class="text-[15px] font-semibold text-gray-900 mb-2">No workshops yet</h3>
        {#if isFacilitator || !session}
          <p class="text-[13px] text-gray-500 mb-5">Create your first workshop to get started.</p>
          <a href="/workshops/new" class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] text-white rounded-lg text-[13px] font-medium hover:bg-[#5A8584] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Workshop
          </a>
        {:else}
          <p class="text-[13px] text-gray-500">No workshops yet. Check back with your facilitator.</p>
        {/if}
      </div>
    {:else}
      {#if filtered.length === 0}
        <p class="text-[14px] text-gray-500">No workshops match your search.</p>
      {:else}
        <div class="grid grid-cols-2 gap-4">
          {#each filtered as w}
            <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">

              <!-- Header row -->
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0 pr-2">
                  <h2 class="text-[14px] text-gray-900 font-semibold leading-snug mb-0.5 truncate">{w.title}</h2>
                  {#if w.focusArea}
                    <p class="text-[11px] text-gray-500 truncate">{w.focusArea}</p>
                  {/if}
                </div>
                <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold {statusColor(w.status)}">{statusLabel(w.status)}</span>
              </div>

              <!-- Objective preview -->
              {#if w.objective}
                <p class="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{w.objective}</p>
              {/if}

              <!-- Stats chips -->
              <div class="flex flex-wrap gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {w.participantCount} participants
                </span>
                {#if w.status === 'pre' && w.contributorCount > 0}
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-[#6B9695]/10 text-[#5A8584] border border-[#6B9695]/20 font-medium">
                    {w.submittedCount}/{w.contributorCount} submitted
                  </span>
                {/if}
              </div>

              <!-- Progress bar (pre-workshop only) -->
              {#if w.status === 'pre' && w.contributorCount > 0}
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] text-gray-400">Submissions</span>
                    <span class="text-[10px] text-gray-600 font-medium">{Math.round((w.submittedCount / w.contributorCount) * 100)}%</span>
                  </div>
                  <div class="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-[#6B9695] rounded-full transition-all" style="width: {Math.round((w.submittedCount / w.contributorCount) * 100)}%"></div>
                  </div>
                </div>
              {/if}

              <!-- Action buttons -->
              <div class="border-t border-gray-100 pt-3 mt-auto flex items-center gap-2">
                {#if isFacilitator}
                  <a href="/workshops/{w.id}/pre"
                    class="flex-1 text-center py-1.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-lg transition-colors text-[12px] font-medium">
                    Manage
                  </a>
                  {#if w.status === 'live'}
                    <a href="/workshop/{w.id}/live"
                      class="flex-1 text-center py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[12px] font-medium">
                      Go Live
                    </a>
                  {:else if w.status === 'completed'}
                    <a href="/workshops/{w.id}/post"
                      class="flex-1 text-center py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[12px] font-medium">
                      Results
                    </a>
                  {/if}
                {:else}
                  {#if w.status === 'pre'}
                    <a href="/workshops/{w.id}/contributor"
                      class="flex-1 text-center py-1.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-lg transition-colors text-[12px] font-medium">
                      Submit Input
                    </a>
                  {:else if w.status === 'live'}
                    <a href="/workshop/{w.id}/live"
                      class="flex-1 text-center py-1.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-lg transition-colors text-[12px] font-medium">
                      Join Live
                    </a>
                  {:else if w.status === 'completed'}
                    <a href="/workshops/{w.id}/post/contributor"
                      class="flex-1 text-center py-1.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-lg transition-colors text-[12px] font-medium">
                      View Results
                    </a>
                  {:else}
                    <span class="text-[12px] text-gray-400 italic">Not yet open</span>
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
