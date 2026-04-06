<script lang="ts">
  import { goto } from '$app/navigation';

  let searchQuery = $state('');

  const workshopId = 'workshop-1';
</script>

<div class="bg-[#FAFAF9] min-h-screen" style="font-family: Inter, sans-serif;">
  <!-- Stats Strip -->
  <div class="bg-white border-b border-gray-200 px-8 py-4">
    <div class="max-w-7xl mx-auto grid grid-cols-3 gap-4">
      {#each [
        { icon: 'activity', label: 'Active Workshops', value: '2' },
        { icon: 'users', label: 'Total Participants', value: '27' },
        { icon: 'lightbulb', label: 'Insights Generated', value: '64' },
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
            <p class="text-[11px] text-gray-500 mb-0.5 font-normal">{stat.label}</p>
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
          <h1 class="text-3xl text-gray-900 mb-2 font-bold">Workshop Mode</h1>
          <p class="text-[14px] text-gray-600 font-normal">Memorial Health System</p>
        </div>
        <a
          href="/workshop/{workshopId}/setup"
          class="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[14px] font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Workshop
        </a>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search workshops..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
          />
        </div>
        <button class="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[14px] font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter
        </button>
      </div>
    </div>

    <!-- Workshop Sections -->
    <div class="space-y-8">
      <!-- Clinical Ops -->
      <div>
        <h2 class="text-[13px] text-gray-500 uppercase tracking-wide mb-4 font-semibold">Clinical Ops</h2>
        <div class="grid grid-cols-1 gap-4">
          <!-- Live Workshop Card -->
          <div class="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div class="space-y-5">
              <h2 class="text-2xl text-gray-900 font-bold">Oncology Intake Redesign</h2>

              <div class="space-y-2.5">
                <div class="flex items-center">
                  <span class="text-[12px] text-gray-500 min-w-[110px] font-normal">Business Unit</span>
                  <span class="text-[12px] text-gray-700 font-normal">Clinical Ops</span>
                </div>
                <div class="flex items-center">
                  <span class="text-[12px] text-gray-500 min-w-[110px] font-normal">Status</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-[#D1FAE5] text-[#065F46] font-medium">Live</span>
                </div>
                <div class="flex items-center">
                  <span class="text-[12px] text-gray-500 min-w-[110px] font-normal">Participants</span>
                  <div class="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span class="text-[12px] text-gray-700 font-normal">3</span>
                  </div>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-5"></div>

              <div class="flex items-center gap-2.5">
                <a
                  href="/workshop/{workshopId}/live"
                  class="px-4 py-2 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px] font-medium"
                >
                  Enter Workshop
                </a>
                <a
                  href="/workshop/{workshopId}/summary"
                  class="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px] font-medium"
                >
                  View Summary
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Care Coordination -->
      <div>
        <h2 class="text-[13px] text-gray-500 uppercase tracking-wide mb-4 font-semibold">Care Coordination</h2>
        <div class="grid grid-cols-1 gap-4">
          <div class="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
            <div class="space-y-5">
              <h3 class="text-2xl text-gray-900 font-bold">Discharge Planning Optimization</h3>

              <div class="space-y-2.5">
                <div class="flex items-center">
                  <span class="text-[12px] text-gray-500 min-w-[110px] font-normal">Business Unit</span>
                  <span class="text-[12px] text-gray-700 font-normal">Care Coordination</span>
                </div>
                <div class="flex items-center">
                  <span class="text-[12px] text-gray-500 min-w-[110px] font-normal">Status</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 font-medium">Upcoming</span>
                </div>
                <div class="flex items-center">
                  <span class="text-[12px] text-gray-500 min-w-[110px] font-normal">Scheduled</span>
                  <span class="text-[12px] text-gray-700 font-normal">Feb 28, 2026 • 2:00 PM</span>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-5"></div>

              <div class="flex items-center gap-2.5">
                <button class="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px] font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
