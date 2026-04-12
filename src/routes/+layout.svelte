<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { Toaster } from '@optura-ai/agent-ui-kit/components/sonner';
  import { initializeTheme } from '@optura-ai/agent-ui-kit/theme/store';
  import { page } from '$app/stores';

  let { children } = $props();

  onMount(() => {
    initializeTheme();
  });

  const isFullScreen = $derived(
    $page.url.pathname.includes('/live') || $page.url.pathname.includes('/setup')
  );
</script>

{#if isFullScreen}
  {@render children()}
{:else}
  <div class="min-h-screen bg-[#f5f5f0]" style="font-family: Inter, sans-serif;">
    <nav class="h-16 bg-[#fbfbfb] border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <a href="/" class="flex items-center hover:opacity-80 transition-opacity ml-2">
        <img src="/optura-logo.png" alt="Optura" class="h-10" />
      </a>

      <div class="flex items-center gap-1">
        {#each ['Workshop', 'Analyst', 'Use Cases', 'Agency', 'Reports'] as tab, i}
          <button
            class="px-4 py-1.5 rounded-md text-[13px] transition-colors {i === 0 ? 'bg-[#F5F3F0] text-gray-900 font-medium' : 'text-gray-700 hover:bg-[#F5F3F0]'}"
          >
            {tab}
          </button>
        {/each}
      </div>

      <div class="flex items-center gap-2">
        <button class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F5F3F0] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
        <button class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F5F3F0] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        </button>
        <button class="w-8 h-8 flex items-center justify-center rounded-md bg-[#4A5568] hover:bg-[#2D3748] transition-colors">
          <span class="text-white text-[11px] font-semibold">A</span>
        </button>
      </div>
    </nav>

    <main>
      {@render children()}
    </main>
  </div>
{/if}

<Toaster />
