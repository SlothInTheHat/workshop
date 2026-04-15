<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const { session, needsAuth, codes } = $derived(data);

  let step = $state(1);
  let showCodesScreen = $state(false);
  let showSuccessScreen = $state(false);
  let generatedFacilitatorCode = $state('');
  let generatedContributorCode = $state('');
  let createdWorkshopId = $state('');
  let createdWorkshopTitle = $state('');
  let createdFacilitatorCode = $state('');
  let createdContributorCode = $state('');

  // Name entry for new facilitators
  let facilitatorName = $state('');
  let submittingName = $state(false);

  // Watch for form response with codes
  $effect(() => {
    if (form?.success && form?.facilitatorCode && form?.contributorCode) {
      generatedFacilitatorCode = form.facilitatorCode;
      generatedContributorCode = form.contributorCode;
      showCodesScreen = true;
    }
  });

  // Step 1
  let title = $state('');
  let focusArea = $state('');
  let objective = $state('');
  let dataSensitivity = $state('internal');

  // Step 2
  let participants = $state<Array<{ name: string; email: string; role: string }>>([]);
  let newName = $state('');
  let newEmail = $state('');
  let newRole = $state('contributor');

  // Step 3
  let kickoffSummary = $state('');
  let generatingSummary = $state(false);
  let summaryError = $state('');
  let creating = $state(false);
  let createError = $state('');

  // Reset form to fresh state on mount
  onMount(() => {
    step = 1;
    showSuccessScreen = false;
    title = '';
    focusArea = '';
    objective = '';
    dataSensitivity = 'internal';
    participants = [];
    newName = '';
    newEmail = '';
    newRole = 'contributor';
    kickoffSummary = '';
    summaryError = '';
    createError = '';
  });

  function addParticipant() {
    const name = newName.trim();
    if (!name) return;
    participants = [...participants, { name, email: newEmail.trim(), role: newRole }];
    newName = '';
    newEmail = '';
    newRole = 'contributor';
  }

  function removeParticipant(i: number) {
    participants = participants.filter((_, idx) => idx !== i);
  }

  async function generateSummary() {
    generatingSummary = true;
    summaryError = '';
    try {
      const res = await fetch('/api/ai/kickoff-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, focusArea, objective, dataSensitivity })
      });
      if (!res.ok) {
        summaryError = 'Failed to generate. Check your ANTHROPIC_API_KEY.';
      } else {
        const result = await res.json() as { summary: string };
        kickoffSummary = result.summary;
      }
    } catch {
      summaryError = 'Could not reach AI service.';
    } finally {
      generatingSummary = false;
    }
  }

  async function createWorkshop() {
    creating = true;
    createError = '';
    try {
      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: session.tenantId,
          title: title.trim(),
          focusArea: focusArea.trim() || undefined,
          objective: objective.trim() || undefined,
          dataSensitivity,
          kickoffSummary: kickoffSummary.trim() || undefined,
          leadFacilitatorName: session.name,
          participants: participants.map(p => ({ name: p.name, email: p.email || undefined, role: p.role }))
        })
      });
      if (!res.ok) {
        createError = 'Failed to create workshop. Please try again.';
      } else {
        const w = await res.json() as { id: string; facilitatorCode: string; contributorCode: string };
        createdWorkshopId = w.id;
        createdWorkshopTitle = title;
        createdFacilitatorCode = w.facilitatorCode;
        createdContributorCode = w.contributorCode;
        showSuccessScreen = true;
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

  const steps = ['Context', 'Participants', 'Review & Generate'];

  const roleLabel = (role: string) => {
    if (role === 'facilitator') return 'Facilitator';
    if (role === 'executive') return 'Executive';
    return 'Contributor';
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'facilitator') return 'bg-blue-100 text-blue-700';
    if (role === 'executive') return 'bg-purple-100 text-purple-700';
    return 'bg-green-100 text-green-700';
  };

  const sensitivityOptions = [
    { value: 'internal', label: 'Internal' },
    { value: 'phi', label: 'Contains PHI' },
    { value: 'deidentified', label: 'De-identified' },
  ];
</script>

<svelte:head>
  <title>Create Workshop — Optura</title>
</svelte:head>

{#if needsAuth}
  <!-- Name Entry Screen for New Facilitators -->
  <div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9] flex items-center justify-center px-4" style="font-family: Inter, sans-serif;">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg border border-gray-200 p-8" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div class="mb-8">
          <h1 class="text-[22px] text-gray-900 font-bold mb-1">Create Workshop</h1>
          <p class="text-[13px] text-gray-500">Enter your name to get started.</p>
        </div>

        {#if form?.error}
          <div class="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-[13px] text-red-700">{form.error}</p>
          </div>
        {/if}

        <form
          method="POST"
          action="?/createSession"
          use:enhance={() => {
            submittingName = true;
            return async ({ update }) => {
              await update();
              submittingName = false;
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
              bind:value={facilitatorName}
              placeholder="e.g. Jane Smith"
              autocomplete="name"
              required
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={submittingName}
            class="w-full py-2.5 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[14px] font-medium transition-colors disabled:opacity-60"
          >
            {submittingName ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  </div>
{:else if showCodesScreen}
  <!-- Codes Display Screen -->
  <div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9] flex items-center justify-center px-4" style="font-family: Inter, sans-serif;">
    <div class="w-full max-w-2xl">
      <div class="bg-white rounded-lg border border-gray-200 p-8" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div class="mb-8">
          <h1 class="text-[22px] text-gray-900 font-bold mb-2">Your Workshop Codes</h1>
          <p class="text-[13px] text-gray-500">Save these codes to share with your team.</p>
        </div>

        <div class="space-y-4 mb-8">
          <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-[13px] text-gray-600 font-medium mb-1">Facilitator Code</h3>
                <p class="text-[11px] text-gray-500">For facilitators to join</p>
              </div>
              <button
                onclick={() => copyToClipboard(generatedFacilitatorCode)}
                class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <div class="font-mono text-[28px] font-bold text-[#6B9695] tracking-widest">
              {generatedFacilitatorCode}
            </div>
          </div>

          <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-[13px] text-gray-600 font-medium mb-1">Contributor Code</h3>
                <p class="text-[11px] text-gray-500">Share with participants</p>
              </div>
              <button
                onclick={() => copyToClipboard(generatedContributorCode)}
                class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <div class="font-mono text-[28px] font-bold text-[#6B9695] tracking-widest">
              {generatedContributorCode}
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>
              <p class="text-[13px] text-blue-900 font-medium mb-1">Share the Contributor Code</p>
              <p class="text-[12px] text-blue-700">Send the contributor code to your participants so they can join and submit their inputs.</p>
            </div>
          </div>
        </div>

        <button
          onclick={() => showCodesScreen = false}
          class="w-full py-3 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[14px] font-medium transition-colors"
        >
          Continue to Create Workshop
        </button>
      </div>
    </div>
  </div>
{:else if showSuccessScreen}
  <!-- Workshop Created Success Screen -->
  <div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9] flex items-center justify-center px-4" style="font-family: Inter, sans-serif;">
    <div class="w-full max-w-2xl">
      <div class="bg-white rounded-lg border border-gray-200 p-8" style="box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 class="text-[24px] text-gray-900 font-bold mb-2">Workshop Created!</h1>
          <p class="text-[15px] text-gray-600">{createdWorkshopTitle}</p>
        </div>

        <div class="space-y-4 mb-8">
          <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-[13px] text-gray-600 font-medium mb-1">Facilitator Code</h3>
                <p class="text-[11px] text-gray-500">For facilitators to join</p>
              </div>
              <button
                onclick={() => copyToClipboard(createdFacilitatorCode)}
                class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <div class="font-mono text-[28px] font-bold text-[#6B9695] tracking-widest">
              {createdFacilitatorCode}
            </div>
          </div>

          <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-[13px] text-gray-600 font-medium mb-1">Contributor Code</h3>
                <p class="text-[11px] text-gray-500">Share with participants</p>
              </div>
              <button
                onclick={() => copyToClipboard(createdContributorCode)}
                class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <div class="font-mono text-[28px] font-bold text-[#6B9695] tracking-widest">
              {createdContributorCode}
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>
              <p class="text-[13px] text-blue-900 font-medium mb-1">Share the Contributor Code</p>
              <p class="text-[12px] text-blue-700">Send the contributor code to your participants so they can join the workshop and submit their inputs.</p>
            </div>
          </div>
        </div>

        <a
          href="/workshops/{createdWorkshopId}/pre"
          class="block w-full py-3 bg-[#6B9695] hover:bg-[#5A8584] text-white text-center rounded-lg text-[14px] font-medium transition-colors"
        >
          Continue to Workshop
        </a>
      </div>
    </div>
  </div>
{:else}
  <!-- Workshop Creation Form -->
  <div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
  <div class="max-w-5xl mx-auto px-8 py-8">

    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
      <a href="/workshops" class="hover:text-gray-700 transition-colors">Workshops</a>
      <span>/</span>
      <span class="text-gray-900">New Workshop</span>
    </div>

    <!-- Step Progress — centered, matching existing setup page -->
    <div class="flex items-center justify-center mb-10 gap-2">
      {#each steps as label, i}
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold {
              i + 1 < step ? 'bg-[#6B9695] text-white' :
              i + 1 === step ? 'bg-[#6B9695] text-white' :
              'bg-gray-200 text-gray-500'
            }">
              {#if i + 1 < step}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {:else}
                {i + 1}
              {/if}
            </div>
            <span class="text-[13px] {i + 1 === step ? 'text-gray-900 font-semibold' : 'text-gray-500'}">{label}</span>
          </div>
          {#if i < steps.length - 1}
            <div class="w-12 h-px bg-gray-300 mx-2"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Main Form (2 cols) -->
      <div class="col-span-2 space-y-6">

        <!-- STEP 1: Context -->
        {#if step === 1}
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-6">Workshop Context</h2>

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
                  placeholder="Describe what you want to achieve with this workshop..."
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent resize-none placeholder:text-gray-400"
                ></textarea>
              </div>

              <div>
                <label class="block text-[13px] text-gray-700 font-medium mb-2">Data Sensitivity</label>
                <div class="flex gap-3">
                  {#each sensitivityOptions as opt}
                    <button
                      onclick={() => dataSensitivity = opt.value}
                      class="flex-1 py-2.5 rounded-lg border text-[13px] font-medium transition-colors {dataSensitivity === opt.value ? 'bg-[#6B9695] text-white border-[#6B9695]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
                    >
                      {opt.label}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  <span class="text-[13px] text-[#6B9695] font-semibold">AI Setup Assistant</span>
                </div>
                <p class="text-[13px] text-gray-700">
                  {#if title && focusArea}
                    Based on <strong>{focusArea}</strong>, I'll help identify key workflow areas, pain points, and opportunity clusters for <strong>{title}</strong>.
                  {:else if title}
                    Add a focus area so I can surface relevant workflow patterns and opportunity clusters for <strong>{title}</strong>.
                  {:else}
                    Fill in the title and focus area above. I'll surface relevant patterns and opportunity clusters for this workshop.
                  {/if}
                </p>
              </div>
            </div>
          </div>

        <!-- STEP 2: Participants -->
        {:else if step === 2}
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-2">Participants & Roles</h2>
            <p class="text-[13px] text-gray-500 mb-6">Add people who will contribute to this workshop. You can also add participants later.</p>

            <!-- Existing list -->
            {#if participants.length > 0}
              <div class="space-y-1 mb-5">
                {#each participants as p, i}
                  <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-[#E6F4F4] flex items-center justify-center text-[13px] font-semibold text-[#6B9695]">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p class="text-[13px] text-gray-900 font-medium">{p.name}</p>
                        {#if p.email}
                          <p class="text-[11px] text-gray-500">{p.email}</p>
                        {/if}
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {roleBadgeColor(p.role)}">{roleLabel(p.role)}</span>
                      <button onclick={() => removeParticipant(i)} class="text-gray-300 hover:text-red-400 transition-colors ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Add form -->
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={newName}
                placeholder="Full name"
                class="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
                onkeydown={(e) => { if (e.key === 'Enter') addParticipant(); }}
              />
              <input
                type="email"
                bind:value={newEmail}
                placeholder="Email (optional)"
                class="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
              />
              <select
                bind:value={newRole}
                class="px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white"
              >
                <option value="contributor">Contributor</option>
                <option value="facilitator">Facilitator</option>
                <option value="executive">Executive</option>
              </select>
              <button
                onclick={addParticipant}
                disabled={!newName.trim()}
                class="px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {#if participants.length === 0}
              <div class="mt-4 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p class="text-[13px] text-gray-400">No participants yet — add them above or skip for now.</p>
              </div>
            {/if}
          </div>

        <!-- STEP 3: Review & Generate -->
        {:else}
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-2">Review & Generate</h2>
            <p class="text-[13px] text-gray-500 mb-6">Review your workshop setup before creating.</p>

            <div class="space-y-4 mb-6">
              {#each [
                { label: 'Title', value: title },
                { label: 'Focus Area', value: focusArea || '—' },
                { label: 'Participants', value: participants.length > 0 ? `${participants.length} added` : 'None — add after creating' },
                { label: 'Data Sensitivity', value: sensitivityOptions.find(o => o.value === dataSensitivity)?.label ?? dataSensitivity },
              ] as item}
                <div class="flex items-start">
                  <span class="text-[13px] text-gray-500 min-w-[140px] font-normal">{item.label}</span>
                  <span class="text-[13px] text-gray-900 font-medium">{item.value}</span>
                </div>
              {/each}
              {#if objective}
                <div class="flex items-start">
                  <span class="text-[13px] text-gray-500 min-w-[140px] font-normal">Objective</span>
                  <span class="text-[13px] text-gray-700 line-clamp-3">{objective}</span>
                </div>
              {/if}
            </div>

            <!-- AI Kickoff Preview -->
            <div class="border-t border-gray-100 pt-5">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-[14px] text-gray-900 font-semibold">AI Kickoff Preview</h3>
                {#if !kickoffSummary}
                  <button
                    onclick={generateSummary}
                    disabled={generatingSummary}
                    class="flex items-center gap-2 px-4 py-2 bg-white border border-[#6B9695] text-[#6B9695] hover:bg-[#F0F9F9] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
                  >
                    {#if generatingSummary}
                      <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Generating...
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      Generate Kickoff Summary
                    {/if}
                  </button>
                {/if}
              </div>

              {#if summaryError}
                <p class="text-[13px] text-red-600 mb-3">{summaryError}</p>
              {/if}

              {#if kickoffSummary}
                <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-4">
                  <textarea
                    bind:value={kickoffSummary}
                    rows={8}
                    class="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none resize-none"
                  ></textarea>
                  <div class="flex gap-2 mt-2 pt-2 border-t border-[#6B9695]/10">
                    <button
                      onclick={generateSummary}
                      disabled={generatingSummary}
                      class="px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-white rounded-lg transition-colors text-[12px] font-medium"
                    >
                      {generatingSummary ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              {/if}
            </div>

            {#if createError}
              <p class="text-[13px] text-red-600 mt-4">{createError}</p>
            {/if}
          </div>
        {/if}

        <!-- Navigation -->
        <div class="flex items-center justify-between">
          <button
            onclick={() => { if (step > 1) step--; else window.location.href = '/'; }}
            class="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px] font-medium"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {#if step < 3}
            <button
              onclick={() => step++}
              disabled={step === 1 && !title.trim()}
              class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          {:else}
            <button
              onclick={createWorkshop}
              disabled={creating}
              class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Workshop'}
            </button>
          {/if}
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-4">
        <!-- Activity / hints -->
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-[13px] text-gray-900 font-semibold mb-4">Setup Progress</h3>
          <div class="space-y-3">
            {#each [
              { icon: step > 1 ? '✅' : '✏️', text: 'Workshop context', done: step > 1 },
              { icon: step > 2 ? '✅' : step === 2 ? '👤' : '○', text: 'Participants', done: step > 2 },
              { icon: step === 3 ? '🚀' : '○', text: 'Review & generate', done: false },
            ] as s}
              <div class="flex items-start gap-2.5">
                <span class="text-base mt-0.5">{s.icon}</span>
                <p class="text-[13px] {s.done ? 'text-gray-900 font-medium' : 'text-gray-500'}">{s.text}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-[13px] text-gray-900 font-semibold mb-3">What happens next</h3>
          <div class="space-y-2">
            {#each [
              'Workshop enters pre-workshop phase',
              'Contributors submit their inputs',
              'AI context is generated',
              'Facilitator reviews and launches',
            ] as item, i}
              <div class="flex items-center gap-2 py-1">
                <div class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-gray-100 text-gray-500 font-semibold shrink-0">{i + 1}</div>
                <span class="text-[13px] text-gray-600">{item}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
{/if}
