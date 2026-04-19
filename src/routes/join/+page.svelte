<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let loading = $state(false);

  let code = $state(data.prefillCode ?? '');
</script>

<svelte:head>
  <title>Join Workshop — Optura</title>
</svelte:head>

<div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9] flex items-center justify-center px-4" style="font-family: Inter, sans-serif;">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-lg border border-gray-200 p-8" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-[22px] text-gray-900 font-bold mb-1">Join Workshop</h1>
        <p class="text-[13px] text-gray-500">Enter your name and the access code provided by your facilitator.</p>
      </div>

      <!-- Existing session banner -->
      {#if data.existingSession?.workshopId}
        <div class="mb-6 px-4 py-4 bg-[#F0F5F5] border border-[#6B9695]/30 rounded-lg">
          <p class="text-[13px] text-gray-700 font-medium mb-1">Welcome back, {data.existingSession.name}</p>
          <p class="text-[12px] text-gray-500 mb-3">You're already part of a workshop as a {data.existingSession.role}.</p>
          <a
            href={data.existingSession.role === 'contributor'
              ? `/workshops/${data.existingSession.workshopId}/contributor`
              : `/workshops/${data.existingSession.workshopId}/pre`}
            class="inline-block px-4 py-2 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[13px] font-medium transition-colors"
          >
            Continue to Workshop →
          </a>
          <p class="mt-3 text-[11px] text-gray-400">Or enter a new code below to join a different workshop.</p>
        </div>
      {/if}

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
        <input type="hidden" name="returnTo" value={data.returnTo} />

        <div>
          <label for="name" class="block text-[13px] text-gray-700 font-medium mb-2">Your Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form?.name ?? ''}
            placeholder="e.g. Jane Smith"
            autocomplete="name"
            required
            autofocus={!!data.prefillCode}
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label for="code" class="block text-[13px] text-gray-700 font-medium mb-2">Access Code</label>
          <input
            id="code"
            name="code"
            type="text"
            bind:value={code}
            placeholder="Enter your code"
            autocomplete="off"
            required
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent tracking-widest uppercase placeholder:text-gray-400"
          />
          <p class="mt-1.5 text-[12px] text-gray-400">Ask your workshop facilitator for the code.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-2.5 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[14px] font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Joining...' : 'Join Workshop'}
        </button>
      </form>
    </div>
  </div>
</div>
