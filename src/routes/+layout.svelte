<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  let { children }: { children: import('svelte').Snippet } = $props();

  const isFullScreen = $derived(
    $page.url.pathname.includes('/live') || $page.url.pathname.includes('/setup')
  );
</script>

{#if isFullScreen}
  {@render children()}
{:else}
  <div class="min-h-screen bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
    <nav class="h-16 bg-[#fafafa] border-b border-[#E5E2DD] px-6 flex items-center justify-between sticky top-0 z-20">
      <a href="/" class="flex items-center hover:opacity-80 transition-opacity">
        <span class="text-[18px] font-bold text-gray-900 tracking-tight">optura</span>
      </a>
    </nav>
    <main>
      {@render children()}
    </main>
  </div>
{/if}
