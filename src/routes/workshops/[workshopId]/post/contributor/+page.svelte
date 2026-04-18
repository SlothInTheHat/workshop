<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();

  type VotingPhase = 'round1' | 'round2';

  let activePhase = $state<VotingPhase>('round1');
  let loadingUpvote = $state<Record<string, boolean>>({});
  let errorMessage = $state<string | null>(null);
  let whyItMattersCache = $state<Map<string, string>>(new Map());
  let loadingWhyItMatters = $state<Set<string>>(new Set());
  let whyItMattersErrors = $state<Set<string>>(new Set());

  // AI summary state
  let showAINotes = $state(false);
  let generatingAI = $state(false);
  let aiSummary = $state<any>(null);
  let aiNotesContent = $state<any>(null);
  let aiSummaryError = $state(false);

  // Local state for usecases (will update from API)
  let useCases = $state(data.useCases || []);
  let workshop = $state(data.workshop);
  let totalParticipants = $state(0);

  const workshopId = $page.params.workshopId;

  // Get currentParticipantId from URL query params (?participantId=p1)
  let currentParticipantId = $state('p1'); // Default fallback

  // Voting status tracking
  let votingStatus = $state({ finishedCount: 0, totalParticipants: 0, allFinished: false, finishedParticipantIds: [] as string[] });
  let hasVotedOnAnyUseCase = $state(false);
  let hasFinishedVoting = $state(false);
  let showFinishConfirmation = $state(false);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    // Get participantId from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paramParticipantId = urlParams.get('participantId');
    if (paramParticipantId) {
      currentParticipantId = paramParticipantId;
    }

    await loadWorkshopData();
    await loadVotingStatus();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  });

  async function loadWorkshopData() {
    try {
      const res = await fetch(`/api/workshop/${workshopId}`);
      if (res.ok) {
        const workshopData = await res.json();
        workshop = workshopData.workshop;

        // Count only contributors (not facilitators or owners) for voting
        const contributors = workshopData.participants?.filter(
          (p: any) => p.role === 'contributor'
        ) || [];

        // If no contributors found, fall back to counting all participants
        totalParticipants = contributors.length > 0
          ? contributors.length
          : (workshopData.participants?.length || 1);
      }
    } catch (err) {
      console.error('Failed to load workshop data:', err);
    }
  }

  async function loadUseCases() {
    try {
      const res = await fetch(`/api/workshop/${workshopId}/usecases`);
      if (res.ok) {
        useCases = await res.json();
      }
    } catch (err) {
      console.error('Failed to load use cases:', err);
    }
  }

  async function loadVotingStatus() {
    try {
      const res = await fetch(`/api/workshop/${workshopId}/voting-status`);
      if (res.ok) {
        votingStatus = await res.json();
        hasFinishedVoting = votingStatus.finishedParticipantIds.includes(currentParticipantId);

        // If all finished, transition to Round 2
        if (votingStatus.allFinished && activePhase === 'round1') {
          activePhase = 'round2';
        }
      }
    } catch (err) {
      console.error('Failed to load voting status:', err);
    }
  }

  async function finishVoting() {
    showFinishConfirmation = false;

    try {
      const res = await fetch(`/api/workshop/${workshopId}/participants/${currentParticipantId}/finish-voting`, {
        method: 'POST',
      });

      if (res.ok) {
        hasFinishedVoting = true;

        // Start polling voting status
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(async () => {
          await loadVotingStatus();
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to finish voting:', err);
    }
  }

  // Map use cases for display with real data
  const rankedUseCases = $derived(
    useCases.map((uc: any) => {
      // Use static values for value and viability
      const valueMap: Record<string, number> = { high: 85, medium: 55, low: 25 };
      const viabilityMap: Record<string, number> = { high: 85, medium: 55, low: 25 };

      const businessValue = valueMap[uc.value?.toLowerCase()] || 55;
      const viability = viabilityMap[uc.viability?.toLowerCase()] || 55;

      return {
        id: uc.id,
        title: uc.title,
        description: uc.summary || 'No description provided',
        contributor: uc.addedBy,
        crowdVoteScore: uc.upvotes || 0,
        whyItMatters: '',
        viability,
        businessValue,
        upvotes: uc.upvotes || 0,
        hasUpvoted: uc.upvotedBy?.includes(currentParticipantId) || false
      };
    })
  );

  // Sorted by upvotes for Round 2
  const sortedUseCases = $derived(
    [...rankedUseCases].sort((a, b) => b.upvotes - a.upvotes)
  );

  async function handleUpvote(useCaseId: string) {
    if (loadingUpvote[useCaseId] || hasFinishedVoting) return;

    loadingUpvote[useCaseId] = true;
    errorMessage = null;

    try {
      const res = await fetch(`/api/workshop/${workshopId}/usecases/${useCaseId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: currentParticipantId }),
      });

      if (res.ok) {
        // Reload use cases to get updated data
        await loadUseCases();

        // Mark that user has voted on at least one use case
        hasVotedOnAnyUseCase = true;
      } else {
        const error = await res.json();
        errorMessage = error.message || 'Failed to vote';
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
      errorMessage = 'Failed to vote. Please try again.';
    } finally {
      loadingUpvote[useCaseId] = false;
    }
  }

  async function fetchWhyItMatters(useCase: any) {
    // If already in cache or useCase has whyItMatters, skip
    if (whyItMattersCache.has(useCase.id) || useCase.whyItMatters) {
      if (useCase.whyItMatters && !whyItMattersCache.has(useCase.id)) {
        whyItMattersCache.set(useCase.id, useCase.whyItMatters);
        whyItMattersCache = whyItMattersCache;
      }
      return;
    }

    loadingWhyItMatters.add(useCase.id);
    whyItMattersErrors.delete(useCase.id);
    loadingWhyItMatters = loadingWhyItMatters; // Trigger reactivity
    whyItMattersErrors = whyItMattersErrors; // Trigger reactivity

    try {
      // Fetch updated usecase data from API
      const res = await fetch(`/api/workshop/${workshopId}/usecases/${useCase.id}`);

      if (res.ok) {
        const data = await res.json();
        if (data.whyItMatters) {
          whyItMattersCache.set(useCase.id, data.whyItMatters);
          whyItMattersCache = whyItMattersCache; // Trigger reactivity
        } else {
          whyItMattersErrors.add(useCase.id);
          whyItMattersErrors = whyItMattersErrors; // Trigger reactivity
        }
      } else {
        whyItMattersErrors.add(useCase.id);
        whyItMattersErrors = whyItMattersErrors; // Trigger reactivity
      }
    } catch (err) {
      console.error('Failed to fetch Why It Matters for', useCase.id, err);
      whyItMattersErrors.add(useCase.id);
      whyItMattersErrors = whyItMattersErrors; // Trigger reactivity
    } finally {
      loadingWhyItMatters.delete(useCase.id);
      loadingWhyItMatters = loadingWhyItMatters; // Trigger reactivity
    }
  }

  async function loadAllWhyItMatters() {
    try {
      const topUseCases = sortedUseCases.slice(0, 3);
      await Promise.all(topUseCases.map(uc => fetchWhyItMatters(uc)));
    } catch (err) {
      console.error('Failed to load whyItMatters for use cases:', err);
    }
  }

  async function generateAISummary() {
    if (generatingAI || aiSummary) return;

    generatingAI = true;
    errorMessage = null;
    aiSummaryError = false;

    try {
      const res = await fetch(`/api/workshop/${workshopId}/summary`, {
        method: 'POST',
      });

      if (res.ok) {
        const summary = await res.json();
        aiSummary = summary.content;
        aiSummaryError = false;
        aiNotesContent = summary.content;

        await loadUseCases();
        await loadAllWhyItMatters();
      } else {
        errorMessage = 'Failed to generate AI summary';
        aiSummaryError = true;
      }
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
      errorMessage = 'Failed to generate AI summary. Please try again.';
      aiSummaryError = true;
    } finally {
      generatingAI = false;
    }
  }

  async function toggleAINotes() {
    showAINotes = !showAINotes;
    if (showAINotes && !aiNotesContent) {
      await generateAISummary();
    }
  }
</script>

<div class="h-full flex flex-col max-w-7xl mx-auto pt-8 pb-12 bg-[#f5f5f0]">
  <!-- Page Header -->
  <div class="mb-6 px-6">
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <h1
          class="text-xl text-gray-900"
          style="font-family: Inter, sans-serif; font-weight: 600"
        >
          Workshop: {workshop?.title || 'Loading...'}
        </h1>
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600"
          style="font-family: Inter, sans-serif; font-weight: 500"
        >
          Completed
        </span>
      </div>

      <!-- Back Button -->
      <a
        href="/workshops"
        class="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px]"
        style="font-family: Inter, sans-serif; font-weight: 500"
      >
        Back to Workshops
      </a>
    </div>

    <!-- Error Message -->
    {#if errorMessage}
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between">
        <p class="text-sm text-red-800">{errorMessage}</p>
      </div>
    {/if}

    <!-- Toggle AI Notes Section -->
    <button
      onclick={toggleAINotes}
      class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors mb-4"
      style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02)"
    >
      <span
        class="text-[13px] text-gray-700"
        style="font-family: Inter, sans-serif; font-weight: 500"
      >
        ▸ Toggle AI Notes
      </span>
      {#if generatingAI}
        <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      {:else if showAINotes}
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      {:else}
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      {/if}
    </button>

    <!-- AI Notes Panel -->
    {#if showAINotes}
      <div class="bg-white border border-gray-200 rounded-lg p-5 mb-4" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)">
        <div class="space-y-4">
          <div>
            <h4
              class="text-[12px] text-gray-900 mb-1.5"
              style="font-family: Inter, sans-serif; font-weight: 600"
            >
              Workshop Overview
            </h4>
            <p
              class="text-[11px] text-gray-600 leading-relaxed"
              style="font-family: Inter, sans-serif; font-weight: 400"
            >
              {aiNotesContent?.overview || `${workshop?.title || 'Workshop'} focused on streamlining processes and reducing administrative bottlenecks.`}
            </p>
          </div>

          <div>
            <h4
              class="text-[12px] text-gray-900 mb-1.5"
              style="font-family: Inter, sans-serif; font-weight: 600"
            >
              Key Bottlenecks Identified
            </h4>
            <p
              class="text-[11px] text-gray-600 leading-relaxed"
              style="font-family: Inter, sans-serif; font-weight: 400"
            >
              {#if aiNotesContent?.keyBottlenecks}
                {aiNotesContent.keyBottlenecks}
              {:else}
                <span class="text-gray-400 italic">No bottlenecks identified yet</span>
              {/if}
            </p>
          </div>

          <div>
            <h4
              class="text-[12px] text-gray-900 mb-1.5"
              style="font-family: Inter, sans-serif; font-weight: 600"
            >
              AI Suggested Themes
            </h4>
            <p
              class="text-[11px] text-gray-600 leading-relaxed"
              style="font-family: Inter, sans-serif; font-weight: 400"
            >
              {#if aiNotesContent?.aiSuggestedThemes}
                {aiNotesContent.aiSuggestedThemes}
              {:else}
                <span class="text-gray-400 italic">No themes identified yet</span>
              {/if}
            </p>
          </div>

          <div>
            <h4
              class="text-[12px] text-gray-900 mb-1.5"
              style="font-family: Inter, sans-serif; font-weight: 600"
            >
              Cross-Workshop Signals
            </h4>
            <p
              class="text-[11px] text-gray-600 leading-relaxed"
              style="font-family: Inter, sans-serif; font-weight: 400"
            >
              {#if aiNotesContent?.crossWorkshopSignals}
                {aiNotesContent.crossWorkshopSignals}
              {:else}
                <span class="text-gray-400 italic">No cross-workshop signals identified yet</span>
              {/if}
            </p>
          </div>

          <div>
            <h4
              class="text-[12px] text-gray-900 mb-1.5"
              style="font-family: Inter, sans-serif; font-weight: 600"
            >
              Recommended Focus Areas
            </h4>
            <p
              class="text-[11px] text-gray-600 leading-relaxed"
              style="font-family: Inter, sans-serif; font-weight: 400"
            >
              {#if aiNotesContent?.recommendedFocusAreas}
                {aiNotesContent.recommendedFocusAreas}
              {:else}
                <span class="text-gray-400 italic">No focus areas recommended yet</span>
              {/if}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Interactive Voting Phase Tabs -->
    <div class="bg-white border border-gray-200 rounded-lg p-1 mb-6 flex gap-1" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)">
      <!-- Round 1 Tab -->
      <button
        onclick={() => (activePhase = 'round1')}
        class={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
          activePhase === 'round1'
            ? 'bg-[#6B9695] text-white shadow-sm'
            : 'bg-transparent text-gray-600 hover:bg-gray-50'
        }`}
      >
        <div class={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
          activePhase === 'round1'
            ? 'bg-white text-[#6B9695]'
            : 'bg-green-500 text-white'
        }`} style="font-family: Inter, sans-serif; font-weight: 600">
          1
        </div>
        <span class="text-[12px]" style="font-family: Inter, sans-serif; font-weight: 500">
          Round 1 – Blind Voting
        </span>
      </button>

      <!-- Round 2 Tab -->
      <button
        onclick={() => votingStatus.allFinished && (activePhase = 'round2')}
        disabled={!votingStatus.allFinished}
        class={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
          activePhase === 'round2'
            ? 'bg-[#6B9695] text-white shadow-sm'
            : votingStatus.allFinished
            ? 'bg-transparent text-gray-600 hover:bg-gray-50'
            : 'bg-transparent text-gray-400 cursor-not-allowed opacity-50'
        }`}
      >
        <div class={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
          activePhase === 'round2'
            ? 'bg-white text-[#6B9695]'
            : votingStatus.allFinished
            ? 'bg-green-500 text-white'
            : 'bg-gray-300 text-gray-500'
        }`} style="font-family: Inter, sans-serif; font-weight: 600">
          2
        </div>
        <span class="text-[12px]" style="font-family: Inter, sans-serif; font-weight: 500">
          Round 2 – Voting Results
        </span>
      </button>
    </div>

    <!-- Phase-Specific Status Banners -->
    {#if activePhase === 'round1'}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <h3
            class="text-[13px] text-blue-900"
            style="font-family: Inter, sans-serif; font-weight: 600"
          >
            Blind voting in progress
          </h3>
          <span
            class="text-[12px] text-blue-700"
            style="font-family: Inter, sans-serif; font-weight: 500"
          >
            {votingStatus.finishedCount}/{votingStatus.totalParticipants} participants finished
          </span>
        </div>
        <div class="w-full bg-blue-100 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: {votingStatus.totalParticipants > 0 ? (votingStatus.finishedCount / votingStatus.totalParticipants * 100) : 0}%"></div>
        </div>
        <p
          class="text-[11px] text-blue-700 mt-2"
          style="font-family: Inter, sans-serif; font-weight: 400"
        >
          Votes are hidden until all participants finish voting.
        </p>
      </div>
    {/if}

    {#if activePhase === 'round2'}
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3
          class="text-[13px] text-purple-900 mb-2"
          style="font-family: Inter, sans-serif; font-weight: 600"
        >
          Voting Results Revealed
        </h3>
        <p
          class="text-[11px] text-purple-700"
          style="font-family: Inter, sans-serif; font-weight: 400"
        >
          All votes have been submitted. Results are now visible to all participants.
        </p>
      </div>
    {/if}
  </div>

  <!-- ROUND 1 – Blind Voting Screen -->
  {#if activePhase === 'round1'}
    <div class="space-y-6 mb-8 px-6">
      <h2
        class="text-[18px] text-gray-900"
        style="font-family: Inter, sans-serif; font-weight: 600"
      >
        Round 1 – Blind Crowd Voting
      </h2>

      <!-- Ideas List -->
      <div class="space-y-4">
        {#each rankedUseCases as useCase}
          <div
            class="bg-white rounded-lg border border-gray-200 p-6"
            style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3
                  class="text-[15px] text-gray-900 mb-2"
                  style="font-family: Inter, sans-serif; font-weight: 600"
                >
                  {useCase.title}
                </h3>

                <!-- Contributor Tag -->
                {#if useCase.contributor}
                  <div class="flex items-center gap-1.5 mb-2">
                    <div
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6] rounded-full"
                    >
                      <svg class="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                      </svg>
                      <span
                        class="text-[12px] text-gray-700"
                        style="font-family: Inter, sans-serif; font-weight: 500"
                      >
                        {useCase.contributor}
                      </span>
                    </div>
                  </div>
                {/if}

                <p
                  class="text-[13px] text-gray-600"
                  style="font-family: Inter, sans-serif; font-weight: 400"
                >
                  {useCase.description}
                </p>
              </div>

              <button
                onclick={() => handleUpvote(useCase.id)}
                disabled={loadingUpvote[useCase.id] || hasFinishedVoting}
                class="ml-6 flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-[#6B9695] hover:bg-[#F0F9F9] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed {useCase.hasUpvoted ? 'bg-[#F0F9F9] border-[#6B9695]' : ''} {hasFinishedVoting ? 'bg-gray-100 border-gray-200' : ''}"
              >
                {#if loadingUpvote[useCase.id]}
                  <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                {:else if hasFinishedVoting}
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                {:else}
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                {/if}
                <span
                  class="text-[13px]"
                  class:text-gray-700={!hasFinishedVoting}
                  class:text-gray-400={hasFinishedVoting}
                  style="font-family: Inter, sans-serif; font-weight: 500"
                >
                  {hasFinishedVoting ? 'Locked' : (useCase.hasUpvoted ? 'Voted' : 'Upvote')}
                </span>
              </button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Finish Voting Button and Status -->
      <div class="space-y-4">
        {#if hasFinishedVoting}
          <!-- Show voting status after finishing -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-[14px] text-green-900" style="font-family: Inter, sans-serif; font-weight: 600">
                Voting Locked
              </h3>
            </div>
            <p class="text-[12px] text-green-700 mb-2" style="font-family: Inter, sans-serif; font-weight: 400">
              Your votes have been submitted. Waiting for other participants...
            </p>
            <p class="text-[13px] text-green-800" style="font-family: Inter, sans-serif; font-weight: 600">
              {votingStatus.finishedCount}/{votingStatus.totalParticipants} participants finished voting
            </p>
          </div>
        {:else}
          <!-- Show Finish Voting button -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h3 class="text-[14px] text-blue-900 mb-1" style="font-family: Inter, sans-serif; font-weight: 600">
                  Ready to finish?
                </h3>
                <p class="text-[12px] text-blue-700" style="font-family: Inter, sans-serif; font-weight: 400">
                  Vote on at least one use case before finishing.
                </p>
              </div>
              <button
                onclick={() => showFinishConfirmation = true}
                disabled={!hasVotedOnAnyUseCase}
                class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                <span class="text-[13px]" style="font-family: Inter, sans-serif; font-weight: 600">
                  Finish Voting
                </span>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Finish Voting Confirmation Dialog -->
  {#if showFinishConfirmation}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 class="text-[16px] text-gray-900 mb-2" style="font-family: Inter, sans-serif; font-weight: 600">
          Finish Voting?
        </h3>
        <p class="text-[13px] text-gray-600 mb-6" style="font-family: Inter, sans-serif; font-weight: 400">
          Are you sure? You cannot change your votes after this.
        </p>
        <div class="flex gap-3">
          <button
            onclick={() => showFinishConfirmation = false}
            class="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            <span class="text-[13px] text-gray-700" style="font-family: Inter, sans-serif; font-weight: 500">
              Cancel
            </span>
          </button>
          <button
            onclick={finishVoting}
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <span class="text-[13px]" style="font-family: Inter, sans-serif; font-weight: 600">
              Confirm
            </span>
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ROUND 2 – Voting Results -->
  {#if activePhase === 'round2'}
    <div class="space-y-6 mb-8 px-6">
      <h2
        class="text-[18px] text-gray-900"
        style="font-family: Inter, sans-serif; font-weight: 600"
      >
        Round 2 – Voting Results
      </h2>

      <!-- Ideas List with Scores -->
      <div class="space-y-4">
        {#each sortedUseCases as useCase}
          <div
            class="bg-white rounded-lg border border-gray-200 p-6"
            style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3
                  class="text-[15px] text-gray-900 mb-2"
                  style="font-family: Inter, sans-serif; font-weight: 600"
                >
                  {useCase.title}
                </h3>

                <!-- Contributor Tag -->
                {#if useCase.contributor}
                  <div class="flex items-center gap-1.5 mb-2">
                    <div
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6] rounded-full"
                    >
                      <svg class="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                      </svg>
                      <span
                        class="text-[12px] text-gray-700"
                        style="font-family: Inter, sans-serif; font-weight: 500"
                      >
                        {useCase.contributor}
                      </span>
                    </div>
                  </div>
                {/if}

                <p
                  class="text-[13px] text-gray-600 mb-4"
                  style="font-family: Inter, sans-serif; font-weight: 400"
                >
                  {useCase.description}
                </p>
              </div>

              <!-- Crowd Score -->
              <div class="ml-6 text-right">
                <span
                  class="text-[11px] text-gray-500 block mb-1"
                  style="font-family: Inter, sans-serif; font-weight: 400"
                >
                  Crowd Score
                </span>
                <p
                  class="text-[24px] text-[#6B9695]"
                  style="font-family: Inter, sans-serif; font-weight: 600"
                >
                  {useCase.upvotes}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
