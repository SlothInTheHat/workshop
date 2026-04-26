<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const { session, workshop, participant, artifacts } = $derived(data);

  let goals = $state(data.existingInput?.goalsAndObjectives ?? '');
  let painPoints = $state(data.existingInput?.painPoints ?? '');
  let currentWorkflow = $state(data.existingInput?.currentWorkflow ?? '');
  let constraints = $state(data.existingInput?.constraints ?? '');
  let successCriteria = $state(data.existingInput?.successCriteria ?? '');
  let strategicPillars = $state(data.existingInput?.strategicPillars ?? '');

  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let submitting = $state(false);
  let submitted = $state(data.existingInput?.status === 'completed');
  let submitError = $state('');

  // Track whether input record exists on server
  let inputCreated = $state(data.existingInput !== null);

  // Workshop status polling
  let statusPollInterval: ReturnType<typeof setInterval>;
  let workshopStarting = $state(false);

  onMount(() => {
    // Poll workshop status every 3 seconds
    statusPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/workshops/${workshop.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.workshop.status === 'live') {
            clearInterval(statusPollInterval);
            workshopStarting = true;
            // Show overlay for 1 second before redirecting
            setTimeout(() => {
              window.location.href = `/workshop/${workshop.id}/live`;
            }, 1000);
          }
        }
      } catch (err) {
        console.error('[Poll] Status check failed:', err);
      }
    }, 3000);
  });

  onDestroy(() => {
    if (statusPollInterval) clearInterval(statusPollInterval);
  });

  const isFilled = (v: string) => v.trim().length > 0;

  const completionPct = $derived(() => {
    const fields = [goals, painPoints, currentWorkflow, constraints, successCriteria, strategicPillars];
    return Math.round((fields.filter(f => isFilled(f)).length / 6) * 100);
  });

  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleAutoSave() {
    if (submitted) return;
    saveStatus = 'saving';
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(autoSave, 1200);
  }

  async function autoSave() {
    if (submitted) return;
    const hasContent = [goals, painPoints, currentWorkflow, constraints, successCriteria, strategicPillars].some(f => isFilled(f));
    if (!hasContent) { saveStatus = 'idle'; return; }

    const url = `/api/workshops/${workshop.id}/inputs/${participant?.id}`;
    const body = { goalsAndObjectives: goals, painPoints, currentWorkflow, constraints, successCriteria, strategicPillars, actorName: session.name };

    try {
      if (!inputCreated) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, tenantId: workshop.tenantId })
        });
        if (res.ok) inputCreated = true;
        else throw new Error();
      } else {
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
      }
      saveStatus = 'saved';
      setTimeout(() => { if (saveStatus === 'saved') saveStatus = 'idle'; }, 2000);
    } catch {
      saveStatus = 'error';
    }
  }

  async function submitInput() {
    if (completionPct() < 100) { submitError = 'Please fill in all 6 sections before submitting.'; return; }
    submitError = '';
    submitting = true;
    const url = `/api/workshops/${workshop.id}/inputs/${participant?.id}`;
    const body = { goalsAndObjectives: goals, painPoints, currentWorkflow, constraints, successCriteria, strategicPillars, submit: true, actorName: session.name, tenantId: workshop.tenantId };

    try {
      const method = inputCreated ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) { submitted = true; }
      else { submitError = 'Failed to submit. Please try again.'; }
    } catch {
      submitError = 'Unexpected error. Please try again.';
    } finally {
      submitting = false;
    }
  }

  const sections = [
    {
      label: 'Goals & Objectives',
      description: 'What outcomes are you hoping to achieve? What does success look like from your perspective?',
      placeholder: 'e.g. Reduce patient wait times by 30%, streamline the referral process...',
      get value() { return goals; },
      set value(v: string) { goals = v; scheduleAutoSave(); }
    },
    {
      label: 'Pain Points',
      description: 'What are the biggest challenges or frustrations in your current workflow?',
      placeholder: 'e.g. Manual data entry causes errors, approval processes take too long...',
      get value() { return painPoints; },
      set value(v: string) { painPoints = v; scheduleAutoSave(); }
    },
    {
      label: 'Current Workflow',
      description: 'Describe how things work today, step by step if possible.',
      placeholder: 'e.g. Patient calls → staff manually enters info → faxed to specialist...',
      get value() { return currentWorkflow; },
      set value(v: string) { currentWorkflow = v; scheduleAutoSave(); }
    },
    {
      label: 'Constraints',
      description: 'What limitations should workshop solutions consider?',
      placeholder: 'e.g. Must comply with HIPAA, limited IT budget, staff availability...',
      get value() { return constraints; },
      set value(v: string) { constraints = v; scheduleAutoSave(); }
    },
    {
      label: 'Success Criteria',
      description: 'How will you know if outcomes are successfully implemented?',
      placeholder: 'e.g. Reduce intake time from 45 min to 20 min, 95% data accuracy...',
      get value() { return successCriteria; },
      set value(v: string) { successCriteria = v; scheduleAutoSave(); }
    },
    {
      label: 'Strategic Pillars',
      description: 'What are the key strategic priorities or themes that should guide this workshop? List 3-5 pillars.',
      placeholder: 'e.g. Patient Experience, Operational Efficiency, Staff Satisfaction, Data Quality, Cost Reduction...',
      get value() { return strategicPillars; },
      set value(v: string) { strategicPillars = v; scheduleAutoSave(); }
    },
  ];
</script>

<svelte:head>
  <title>{workshop.title} — Pre-Workshop Input — Optura</title>
</svelte:head>

<div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
  <div class="max-w-5xl mx-auto px-8 py-8">

    <!-- Breadcrumb + Header -->
    <div class="flex items-start gap-2 text-[13px] text-gray-500 mb-2">
      <a href="/workshops" class="hover:text-gray-700 transition-colors">Workshops</a>
      <span>/</span>
      <span class="text-gray-900">Pre-Workshop Input</span>
    </div>
    <h1 class="text-[22px] text-gray-900 font-bold mb-1">{workshop.title}</h1>
    <p class="text-[13px] text-gray-500 mb-8">
      Welcome, <span class="font-medium text-gray-700">{session.name}</span>. Please complete all five sections before the workshop.
    </p>

    {#if submitted}
      <!-- Submitted confirmation -->
      <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 class="text-[18px] text-gray-900 font-semibold mb-2">Input Submitted!</h2>
        <p class="text-[13px] text-gray-500 mb-6">Your pre-workshop input has been received. The facilitator will review it before the live session.</p>

        <div class="text-left bg-[#F9F9F8] rounded-lg border border-gray-200 p-5 mb-6 space-y-4">
          {#each [
            { label: 'Goals & Objectives', value: goals },
            { label: 'Pain Points', value: painPoints },
            { label: 'Current Workflow', value: currentWorkflow },
            { label: 'Constraints', value: constraints },
            { label: 'Success Criteria', value: successCriteria },
          ] as s}
            <div>
              <p class="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">{s.label}</p>
              <p class="text-[13px] text-gray-800">{s.value || '—'}</p>
            </div>
          {/each}
        </div>

        <a href="/workshops" class="inline-flex px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
          Back to Workshops
        </a>
      </div>

    {:else}
      <div class="grid grid-cols-3 gap-6">
        <!-- Main form -->
        <div class="col-span-2 space-y-5">

          <!-- Progress bar -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] text-gray-700 font-medium">Your Progress</span>
              <div class="flex items-center gap-3">
                {#if saveStatus === 'saving'}
                  <span class="text-[11px] text-gray-400">Saving...</span>
                {:else if saveStatus === 'saved'}
                  <span class="text-[11px] text-green-600">Saved</span>
                {:else if saveStatus === 'error'}
                  <span class="text-[11px] text-red-500">Save failed</span>
                {/if}
                <span class="text-[13px] text-gray-900 font-semibold">{completionPct()}%</span>
              </div>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-[#6B9695] rounded-full transition-all duration-300" style="width: {completionPct()}%"></div>
            </div>
          </div>

          <!-- Input sections card -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="divide-y divide-gray-100">
              {#each sections as s, i}
                <div class="p-6">
                  <div class="flex items-start gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 {isFilled(s.value) ? 'bg-[#6B9695] text-white' : 'bg-gray-100 text-gray-500'} text-[12px] font-semibold">
                      {#if isFilled(s.value)}✓{:else}{i + 1}{/if}
                    </div>
                    <div>
                      <label class="block text-[13px] text-gray-700 font-medium">{s.label}</label>
                      <p class="text-[12px] text-gray-400 mt-0.5">{s.description}</p>
                    </div>
                  </div>
                  <textarea
                    value={s.value}
                    oninput={(e) => { s.value = (e.target as HTMLTextAreaElement).value; }}
                    placeholder={s.placeholder}
                    rows={4}
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent resize-none placeholder:text-gray-400"
                  ></textarea>
                </div>
              {/each}
            </div>

            <!-- Submit footer -->
            <div class="p-5 bg-[#FAFAF9] border-t border-gray-200">
              {#if submitError}
                <p class="text-[13px] text-red-600 mb-3">{submitError}</p>
              {/if}
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[13px] text-gray-600">
                    {#if completionPct() === 100}
                      All sections complete — ready to submit.
                    {:else}
                      Complete all 5 sections to submit. ({completionPct()}% done)
                    {/if}
                  </p>
                  <p class="text-[11px] text-gray-400 mt-0.5">Responses auto-save as you type.</p>
                </div>
                <button
                  onclick={submitInput}
                  disabled={submitting || completionPct() < 100}
                  class="px-5 py-2.5 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-4">
          <!-- Workshop Context -->
          {#if workshop.objective || workshop.focusArea}
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <h3 class="text-[13px] text-gray-900 font-semibold mb-3">Workshop Context</h3>
              <div class="space-y-3">
                {#if workshop.objective}
                  <div>
                    <p class="text-[11px] text-gray-500 font-medium mb-1">Objective</p>
                    <p class="text-[13px] text-gray-700 leading-relaxed">{workshop.objective}</p>
                  </div>
                {/if}
                {#if workshop.focusArea}
                  <div>
                    <p class="text-[11px] text-gray-500 font-medium mb-1">Focus Area</p>
                    <p class="text-[13px] text-gray-700">{workshop.focusArea}</p>
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Kickoff Summary -->
          {#if workshop.kickoffSummary}
            <div class="bg-[#F9F9F8] rounded-lg border border-gray-200 p-5">
              <div class="flex items-start gap-2 mb-3">
                <h3 class="text-[13px] text-gray-900 font-semibold">AI Kickoff Summary</h3>
              </div>
              <div class="text-[13px] text-gray-700 leading-relaxed space-y-2">
                {#each workshop.kickoffSummary.split('\n\n') as paragraph}
                  {#if paragraph.trim()}
                    <p>{paragraph}</p>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}

          <!-- Section status -->
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="text-[13px] text-gray-900 font-semibold mb-4">Sections</h3>
            <div class="space-y-2">
              {#each sections as s, i}
                <div class="flex items-center gap-2.5 py-1">
                  <span class="text-sm">{isFilled(s.value) ? '•' : '○'}</span>
                  <span class="text-[13px] {isFilled(s.value) ? 'text-gray-900 font-medium' : 'text-gray-500'}">{s.label}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Reference materials -->
          {#if artifacts.length > 0}
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <h3 class="text-[13px] text-gray-900 font-semibold mb-3">Reference Materials</h3>
              <div class="space-y-2">
                {#each artifacts as a}
                  <a
                    href={a.storageUrl}
                    target="_blank"
                    rel="noopener"
                    class="flex items-start gap-2.5 py-2 hover:opacity-80 transition-opacity"
                  >
                    <div class="min-w-0">
                      <p class="text-[13px] text-gray-900 font-medium">{a.title}</p>
                      <p class="text-[11px] text-[#6B9695] truncate">{a.storageUrl.slice(0, 40)}…</p>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Workshop Starting Overlay -->
{#if workshopStarting}
  <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl">
      <div class="w-16 h-16 mx-auto mb-4 relative">
        <div class="absolute inset-0 border-4 border-[#6B9695] border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 class="text-[20px] text-gray-900 font-bold mb-2">Workshop is starting...</h2>
      <p class="text-[14px] text-gray-600">Redirecting you to the live workshop</p>
    </div>
  </div>
{/if}
