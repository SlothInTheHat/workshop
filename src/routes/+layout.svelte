<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { Toaster } from '@optura-ai/agent-ui-kit/components/sonner';
  import { initializeTheme } from '@optura-ai/agent-ui-kit/theme/store';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  let { children, data }: { children: import('svelte').Snippet; data: PageData } = $props();
  const user = $derived(data.user);

  onMount(() => {
    initializeTheme();
  });

  // Live and setup pages manage their own full-screen layouts
  const isFullScreen = $derived(
    $page.url.pathname.includes('/live') || $page.url.pathname.includes('/setup')
  );
</script>

{#if isFullScreen}
  {@render children()}
{:else}
  <div class="min-h-screen bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
    <!-- Top Nav -->
    <nav class="h-16 bg-[#fafafa] border-b border-[#E5E2DD] px-6 flex items-center justify-between sticky top-0 z-20">
      <a href="/" class="flex items-center hover:opacity-80 transition-opacity">
        <span class="text-[18px] font-bold text-gray-900 tracking-tight">optura</span>
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
        {#if user}
          <span class="text-[12px] text-gray-500 mr-1">{user.name}</span>
          <div class="w-8 h-8 rounded-full {user.color} flex items-center justify-center text-white text-[11px] font-semibold" title={user.name}>
            {user.initials}
          </div>
          <form method="POST" action="/auth/logout">
            <button type="submit" class="px-3 py-1.5 text-[12px] text-gray-600 hover:bg-[#F5F3F0] rounded-md transition-colors">
              Sign out
            </button>
          </form>
        {:else}
          <a href="/auth/login" class="px-3 py-1.5 text-[12px] text-gray-600 hover:bg-[#F5F3F0] rounded-md transition-colors">Sign in</a>
          <a href="/auth/register" class="px-3 py-1.5 text-[12px] bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-md transition-colors">Register</a>
        {/if}
      </div>
    </nav>

    <main>
      {@render children()}
    </main>
  </div>
{/if}

<Toaster />
