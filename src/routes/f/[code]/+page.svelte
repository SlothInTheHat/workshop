<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Join as Facilitator — Optura</title>
</svelte:head>

<div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9] flex items-center justify-center px-4" style="font-family: Inter, sans-serif;">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-lg border border-gray-200 p-8" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-[22px] text-gray-900 font-bold mb-1">Join as Facilitator</h1>
        <p class="text-[13px] text-gray-500">Enter your name to access the workshop.</p>
      </div>

      <!-- Error -->
      {#if form?.error}
        <div class="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-[13px] text-red-700">{form.error}</p>
        </div>
      {/if}

      <!-- Form -->
      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
        class="space-y-5"
      >
        <div>
          <label for="name" class="block text-[13px] text-gray-700 font-medium mb-2">Your Name</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="e.g. Jane Smith"
            autocomplete="name"
            required
            autofocus
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-2.5 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[14px] font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Joining...' : 'Continue to Workshop'}
        </button>
      </form>
    </div>
  </div>
</div>
