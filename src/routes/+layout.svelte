<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { Toaster } from '@optura-ai/agent-ui-kit/components/sonner';
  import { initializeTheme } from '@optura-ai/agent-ui-kit/theme/store';

  let { children } = $props();

  onMount(() => {
    initializeTheme();
  });
</script>

<div class="flex min-h-screen flex-col">
  <header
    class="border-border bg-card/95 supports-backdrop-filter:bg-card/60 sticky top-0 z-20 border-b backdrop-blur"
  >
    <div
      class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <a
        href="/"
        class="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <h1 class="text-foreground text-lg font-semibold">Workshop Agent</h1>
      </a>
    </div>
  </header>

  <main class="bg-background flex-1">
    {@render children()}
  </main>
</div>

<Toaster />
