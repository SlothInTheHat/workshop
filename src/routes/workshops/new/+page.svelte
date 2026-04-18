<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { session } = $derived(data);

  let step = $state(1);
  let showCodesScreen = $state(false);

  // Step 1
  let title = $state('');
  let client = $state('');
  let focusArea = $state('');
  let objective = $state('');

  // Step 2
  let participants = $state<Array<{ name: string; email: string; role: string }>>([]);
  let newParticipantName = $state('');
  let newParticipantEmail = $state('');
  let newParticipantRole = $state('contributor');

  // Creation state
  let creating = $state(false);
  let createError = $state('');

  // Created workshop data
  let createdWorkshopId = $state('');
  let createdWorkshopTitle = $state('');
  let facilitatorCode = $state('');
  let contributorCode = $state('');

  function addParticipant() {
    const name = newParticipantName.trim();
    const email = newParticipantEmail.trim();
    if (!name || !email) return;
    participants = [...participants, { name, email, role: newParticipantRole }];
    newParticipantName = '';
    newParticipantEmail = '';
    newParticipantRole = 'contributor';
  }

  function removeParticipant(i: number) {
    participants = participants.filter((_, idx) => idx !== i);
  }

  const roleLabel = (role: string) => {
    if (role === 'facilitator') return 'Facilitator';
    return 'Contributor';
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'facilitator') return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  async function createWorkshop() {
    creating = true;
    createError = '';
    try {
      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          client: client.trim(),
          focusArea: focusArea.trim() || undefined,
          objective: objective.trim() || undefined,
          participants
        })
      });
      if (!res.ok) {
        createError = 'Failed to create workshop. Please try again.';
      } else {
        const w = await res.json() as { id: string; facilitatorCode: string; contributorCode: string };
        createdWorkshopId = w.id;
        createdWorkshopTitle = title;
        facilitatorCode = w.facilitatorCode;
        contributorCode = w.contributorCode;
        showCodesScreen = true;
      }
    } catch {
      createError = 'Unexpected error. Please try again.';
    } finally {
      creating = false;
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<svelte:head>
  <title>Create Workshop — Optura</title>
</svelte:head>

{#if showCodesScreen}
  <!-- Codes Screen -->
  <div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9] flex items-center justify-center px-4" style="font-family: Inter, sans-serif;">
    <div class="w-full max-w-4xl">
      <div class="bg-white rounded-lg border border-gray-200 p-8" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div class="mb-8">
          <h1 class="text-[24px] text-gray-900 font-bold mb-2">Workshop Created!</h1>
          <p class="text-[15px] text-gray-600">{createdWorkshopTitle}</p>
          {#if participants.length > 0}
            <div class="mt-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-[13px] text-green-700">
                ✓ Invites sent to {participants.length} participant{participants.length > 1 ? 's' : ''}
              </p>
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-6 mb-8">
          <!-- Facilitator Link -->
          <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5">
            <div class="mb-4">
              <h3 class="text-[14px] text-gray-900 font-semibold mb-1">Facilitator Link</h3>
              <p class="text-[12px] text-gray-500">Share this with yourself</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-3 mb-3 break-all">
              <p class="text-[13px] text-gray-700 font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/f/{facilitatorCode}
              </p>
            </div>
            <button
              onclick={() => copyToClipboard((typeof window !== 'undefined' ? window.location.origin : '') + '/f/' + facilitatorCode)}
              class="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors"
            >
              Copy Link
            </button>
          </div>

          <!-- Contributor Link -->
          <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5">
            <div class="mb-4">
              <h3 class="text-[14px] text-gray-900 font-semibold mb-1">Contributor Link</h3>
              <p class="text-[12px] text-gray-500">Share with participants</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-3 mb-3 break-all">
              <p class="text-[13px] text-gray-700 font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/c/{contributorCode}
              </p>
            </div>
            <button
              onclick={() => copyToClipboard((typeof window !== 'undefined' ? window.location.origin : '') + '/c/' + contributorCode)}
              class="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>

        <a
          href="/workshops/{createdWorkshopId}/pre"
          class="block w-full py-3 bg-[#6B9695] hover:bg-[#5A8584] text-white text-center rounded-lg text-[14px] font-medium transition-colors"
        >
          Go to Workshop Dashboard
        </a>
      </div>
    </div>
  </div>
{:else}
  <!-- Workshop Creation Form -->
  <div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
    <div class="max-w-3xl mx-auto px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-[28px] text-gray-900 font-bold mb-2">Create Workshop</h1>
        <p class="text-[14px] text-gray-600">Set up a new workshop for your team</p>
      </div>

      <!-- Step 1: Workshop Details -->
      {#if step === 1}
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-[18px] text-gray-900 font-semibold mb-6">Workshop Details</h2>

          <div class="space-y-5">
            <div>
              <label class="block text-[13px] text-gray-700 font-medium mb-2">Workshop Title <span class="text-red-500">*</span></label>
              <input
                type="text"
                bind:value={title}
                placeholder="e.g. Oncology Intake Redesign"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
              />
            </div>

            <div>
              <label class="block text-[13px] text-gray-700 font-medium mb-2">Organization/Client Name <span class="text-red-500">*</span></label>
              <input
                type="text"
                bind:value={client}
                placeholder="e.g. Acme Healthcare"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
              />
            </div>

            <div>
              <label class="block text-[13px] text-gray-700 font-medium mb-2">Focus Area</label>
              <input
                type="text"
                bind:value={focusArea}
                placeholder="e.g. Clinical Operations, Patient Intake"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
              />
            </div>

            <div>
              <label class="block text-[13px] text-gray-700 font-medium mb-2">Objective</label>
              <textarea
                bind:value={objective}
                rows={4}
                placeholder="What do you want to achieve?"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent resize-none placeholder:text-gray-400"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <a
            href="/"
            class="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px] font-medium"
          >
            Cancel
          </a>
          <button
            onclick={() => step = 2}
            disabled={!title.trim() || !client.trim()}
            class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>

      <!-- Step 2: Add Participants -->
      {:else}
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-[18px] text-gray-900 font-semibold mb-2">Add Participants</h2>
          <p class="text-[13px] text-gray-500 mb-6">Add participants with email addresses to send them invitations.</p>

          <!-- Participant list -->
          {#if participants.length > 0}
            <div class="space-y-2 mb-5">
              {#each participants as p, i}
                <div class="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-8 h-8 rounded-full bg-[#E6F4F4] flex items-center justify-center text-[13px] font-semibold text-[#6B9695]">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                      <p class="text-[13px] text-gray-900 font-medium">{p.name}</p>
                      <p class="text-[12px] text-gray-500">{p.email}</p>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {roleBadgeColor(p.role)}">
                      {roleLabel(p.role)}
                    </span>
                  </div>
                  <button onclick={() => removeParticipant(i)} class="text-gray-400 hover:text-red-500 transition-colors ml-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Add form -->
          <div class="space-y-2 mb-4">
            <div class="grid grid-cols-12 gap-2">
              <input
                type="text"
                bind:value={newParticipantName}
                placeholder="Full name"
                class="col-span-4 px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
                onkeydown={(e) => { if (e.key === 'Enter') addParticipant(); }}
              />
              <input
                type="email"
                bind:value={newParticipantEmail}
                placeholder="Email address"
                class="col-span-5 px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
                onkeydown={(e) => { if (e.key === 'Enter') addParticipant(); }}
              />
              <select
                bind:value={newParticipantRole}
                class="col-span-2 px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white"
              >
                <option value="contributor">Contributor</option>
                <option value="facilitator">Facilitator</option>
              </select>
              <button
                onclick={addParticipant}
                disabled={!newParticipantName.trim() || !newParticipantEmail.trim()}
                class="col-span-1 px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <a href="#" onclick={(e) => { e.preventDefault(); step = 1; }} class="text-[13px] text-gray-500 hover:text-gray-700 underline">
            Skip for now
          </a>
        </div>

        {#if createError}
          <div class="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-[13px] text-red-700">{createError}</p>
          </div>
        {/if}

        <div class="flex items-center justify-between">
          <button
            onclick={() => step = 1}
            class="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px] font-medium"
          >
            Back
          </button>
          <button
            onclick={createWorkshop}
            disabled={creating}
            class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Workshop'}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
