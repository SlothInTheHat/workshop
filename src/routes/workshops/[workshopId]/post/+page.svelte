<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';

  let { data }: { data: PageData } = $props();

  type VotingPhase = 'round1' | 'round2' | 'final';

  let activePhase = $state<VotingPhase>('round1');
  let showAINotes = $state(false);
  let loadingUpvote = $state<Record<string, boolean>>({});
  let generatingAI = $state(false);
  let aiSummary = $state<any>(null);
  let aiNotesContent = $state<any>(null);
  let errorMessage = $state<string | null>(null);
  let aiSummaryError = $state(false);
  let whyItMattersCache = $state<Map<string, string>>(new Map());
  let loadingWhyItMatters = $state<Set<string>>(new Set());
  let whyItMattersErrors = $state<Set<string>>(new Set());
  let downloadingReport = $state(false);

  // Local state for usecases (will update from API)
  let useCases = $state(data.useCases || []);
  let stackRank = $state(data.stackRank || []);
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

  async function loadStackRank() {
    try {
      const res = await fetch(`/api/workshop/${workshopId}/stackrank`);
      if (res.ok) {
        stackRank = await res.json();
      }
    } catch (err) {
      console.error('Failed to load stack rank:', err);
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

  // Map use cases for display with real data from stackRank
  const rankedUseCases = $derived(
    useCases.map((uc: any) => {
      // Find corresponding stackRank entry for this use case
      const stackRankEntry = stackRank.find((sr: any) => sr.id === uc.id);

      // Use impactAvg and feasibilityAvg from stackRank (1-10 scale, multiply by 10 for percentage)
      // Fall back to static values if no scores yet
      const valueMap: Record<string, number> = { high: 85, medium: 55, low: 25 };
      const viabilityMap: Record<string, number> = { high: 85, medium: 55, low: 25 };

      const businessValue = stackRankEntry?.impactAvg
        ? stackRankEntry.impactAvg * 10
        : valueMap[uc.value?.toLowerCase()] || 55;

      const viability = stackRankEntry?.feasibilityAvg
        ? stackRankEntry.feasibilityAvg * 10
        : viabilityMap[uc.viability?.toLowerCase()] || 55;

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

  // Top ranked from stack rank API
  const topRankedUseCases = $derived(
    stackRank.slice(0, 3).map((uc: any) => ({
      ...uc,
      whyItMatters: whyItMattersCache.get(uc.id) || ''
    }))
  );

  // Strategic pillars from workshop data
  const strategicPillars = $derived(
    (workshop?.strategicPillars as string[]) || []
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
      const topUseCases = stackRank.slice(0, 3);
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
        // Content is now a structured JSON object
        aiSummary = summary.content;
        aiSummaryError = false;
        aiNotesContent = summary.content;

        // After summary is generated, reload use cases to get whyItMatters
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

  async function downloadExecutiveReport() {
    downloadingReport = true;

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // HEADER
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Optura', 20, yPos);

      yPos += 10;
      doc.setFontSize(16);
      doc.text('Executive Workshop Report', 20, yPos);

      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${workshop?.title || 'Workshop'}`, 20, yPos);

      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);

      yPos += 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      // WORKSHOP CONTEXT SECTION
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Workshop Context', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Strategic Priorities:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const priorities = Array.isArray(workshop?.strategicPillars) ? workshop.strategicPillars.join(', ') : 'Not specified';
      const prioritiesLines = doc.splitTextToSize(priorities, 170);
      doc.text(prioritiesLines, 20, yPos);
      yPos += prioritiesLines.length * 5 + 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Workshop Objectives:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const objectives = Array.isArray(workshop?.objectives) ? workshop.objectives.join(', ') : 'Not specified';
      const objectivesLines = doc.splitTextToSize(objectives, 170);
      doc.text(objectivesLines, 20, yPos);
      yPos += objectivesLines.length * 5 + 10;

      // TOP OPPORTUNITIES SECTION
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Opportunities', 20, yPos);
      yPos += 8;

      const topUseCases = stackRank.slice(0, 5);
      for (let i = 0; i < topUseCases.length; i++) {
        const uc = topUseCases[i];

        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${uc.title}`, 20, yPos);
        yPos += 5;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Contributor: ${uc.addedBy || 'Unknown'}`, 25, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const summaryLines = doc.splitTextToSize(uc.summary || 'No summary provided', 165);
        doc.text(summaryLines, 25, yPos);
        yPos += summaryLines.length * 4 + 3;

        // Why It Matters
        const whyItMatters = whyItMattersCache.get(uc.id) || uc.whyItMatters;
        if (whyItMatters) {
          doc.setFont('helvetica', 'bold');
          doc.text('Why It Matters:', 25, yPos);
          yPos += 4;
          doc.setFont('helvetica', 'normal');
          const whyLines = doc.splitTextToSize(whyItMatters, 165);
          doc.text(whyLines, 25, yPos);
          yPos += whyLines.length * 4;
        }

        yPos += 6;
      }

      // ALIGNMENT WITH STRATEGIC PILLARS
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Alignment with Strategic Pillars', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (Array.isArray(workshop?.strategicPillars) && workshop.strategicPillars.length > 0) {
        workshop.strategicPillars.forEach((pillar: string) => {
          doc.text(`• ${pillar}`, 25, yPos);
          yPos += 5;
        });
      } else {
        doc.text('No strategic pillars defined', 25, yPos);
        yPos += 5;
      }

      // VALUE VS VIABILITY SUMMARY
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Value vs Viability Summary', 20, yPos);
      yPos += 5;

      const tableData = topUseCases.map((uc) => [
        uc.title,
        uc.value || 'N/A',
        uc.viability || 'N/A',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Use Case', 'Value', 'Viability']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [107, 150, 149] },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // AI NOTES SECTION
      if (aiNotesContent) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AI-Generated Insights', 20, yPos);
        yPos += 8;

        // Workshop Overview
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Workshop Overview', 20, yPos);
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (aiNotesContent.overview) {
          const overviewLines = doc.splitTextToSize(aiNotesContent.overview, 170);
          doc.text(overviewLines, 20, yPos);
          yPos += overviewLines.length * 4 + 6;
        }

        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        // Key Bottlenecks
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Bottlenecks', 20, yPos);
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (aiNotesContent.keyBottlenecks) {
          const bottleneckLines = doc.splitTextToSize(aiNotesContent.keyBottlenecks, 170);
          doc.text(bottleneckLines, 20, yPos);
          yPos += bottleneckLines.length * 4 + 6;
        }

        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        // AI Suggested Themes
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Suggested Themes', 20, yPos);
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (aiNotesContent.aiSuggestedThemes) {
          const themesLines = doc.splitTextToSize(aiNotesContent.aiSuggestedThemes, 170);
          doc.text(themesLines, 20, yPos);
          yPos += themesLines.length * 4 + 6;
        }

        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        // Recommended Focus Areas
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommended Focus Areas', 20, yPos);
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (aiNotesContent.recommendedFocusAreas) {
          const focusLines = doc.splitTextToSize(aiNotesContent.recommendedFocusAreas, 170);
          doc.text(focusLines, 20, yPos);
          yPos += focusLines.length * 4;
        }
      }

      // Generate filename
      const filename = `${workshop?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'workshop'}-executive-report.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      errorMessage = 'Failed to generate PDF report. Please try again.';
    } finally {
      downloadingReport = false;
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
        {#if aiSummaryError}
          <button
            onclick={async () => {
              aiSummary = null;
              await generateAISummary();
              await loadAllWhyItMatters();
            }}
            class="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            style="font-family: Inter, sans-serif; font-weight: 500"
          >
            Try Again
          </button>
        {/if}
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

      <!-- Executive Summary Tab -->
      <button
        onclick={() => votingStatus.allFinished && (activePhase = 'final')}
        disabled={!votingStatus.allFinished}
        class={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
          activePhase === 'final'
            ? 'bg-[#6B9695] text-white shadow-sm'
            : votingStatus.allFinished
            ? 'bg-transparent text-gray-600 hover:bg-gray-50'
            : 'bg-transparent text-gray-400 cursor-not-allowed opacity-50'
        }`}
      >
        <div class={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
          activePhase === 'final'
            ? 'bg-white text-[#6B9695]'
            : votingStatus.allFinished
            ? 'bg-gray-200 text-gray-600'
            : 'bg-gray-300 text-gray-500'
        }`} style="font-family: Inter, sans-serif; font-weight: 600">
          3
        </div>
        <span class="text-[12px]" style="font-family: Inter, sans-serif; font-weight: 500">
          Executive Summary
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

      <!-- Proceed Button -->
    </div>
  {/if}

  <!-- EXECUTIVE SUMMARY -->
  {#if activePhase === 'final'}
    <div class="space-y-6 mb-8 px-6">
      <div class="flex items-center justify-between mb-6">
        <h2
          class="text-[20px] text-gray-900"
          style="font-family: Inter, sans-serif; font-weight: 600"
        >
          Executive Workshop Summary
        </h2>
        <button
          onclick={downloadExecutiveReport}
          disabled={downloadingReport}
          class="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
          style="font-family: Inter, sans-serif; font-weight: 500"
        >
          {#if downloadingReport}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          {/if}
          <span>{downloadingReport ? 'Generating...' : 'Download Executive Report'}</span>
        </button>
      </div>

      {#if generatingAI}
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-[#6B9695] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-sm text-gray-600">Generating AI summary...</p>
          </div>
        </div>
      {:else}
        <!-- Workshop Context -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)">
          <h3
            class="text-[16px] text-gray-900 mb-4"
            style="font-family: Inter, sans-serif; font-weight: 600"
          >
            Workshop Context
          </h3>
          <div class="space-y-3">
            <div>
              <span
                class="text-[12px] text-gray-500 block mb-1"
                style="font-family: Inter, sans-serif; font-weight: 500"
              >
                Client Strategic Priorities
              </span>
              <p
                class="text-[13px] text-gray-700"
                style="font-family: Inter, sans-serif; font-weight: 400"
              >
                {#if aiSummary?.overview}
                  {aiSummary.overview}
                {:else}
                  <span class="text-gray-400 italic">No strategic priorities generated yet</span>
                {/if}
              </p>
            </div>
            <div>
              <span
                class="text-[12px] text-gray-500 block mb-1"
                style="font-family: Inter, sans-serif; font-weight: 500"
              >
                Workshop Objectives
              </span>
              {#if workshop?.objectives && (workshop.objectives as string[]).length > 0}
                <ul class="list-disc list-inside text-[13px] text-gray-700 space-y-1" style="font-family: Inter, sans-serif; font-weight: 400">
                  {#each (workshop.objectives as string[]) as objective}
                    <li>{objective}</li>
                  {/each}
                </ul>
              {:else}
                <p class="text-[13px] text-gray-400 italic" style="font-family: Inter, sans-serif; font-weight: 400">
                  No workshop objectives defined
                </p>
              {/if}
            </div>
            <div>
              <span
                class="text-[12px] text-gray-500 block mb-1"
                style="font-family: Inter, sans-serif; font-weight: 500"
              >
                Key Workflow Area Discussed
              </span>
              <p
                class="text-[13px] text-gray-700"
                style="font-family: Inter, sans-serif; font-weight: 400"
              >
                {workshop?.title || 'Workshop'} workflows and process optimization
              </p>
            </div>
          </div>
        </div>

        <!-- Top Opportunities Identified -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)">
          <h3
            class="text-[16px] text-gray-900 mb-4"
            style="font-family: Inter, sans-serif; font-weight: 600"
          >
            Top Opportunities Identified
          </h3>
          <div class="space-y-5">
            {#each topRankedUseCases.length > 0 ? topRankedUseCases : sortedUseCases.slice(0, 3) as useCase, index}
              <div
                class="border-l-4 border-[#6B9695] pl-5 py-2"
              >
                <div class="flex items-start gap-3 mb-2">
                  <div
                    class="w-6 h-6 rounded-full bg-[#6B9695] text-white flex items-center justify-center text-[11px] flex-shrink-0"
                    style="font-family: Inter, sans-serif; font-weight: 600"
                  >
                    {index + 1}
                  </div>
                  <div class="flex-1">
                    <h4
                      class="text-[15px] text-gray-900 mb-1"
                      style="font-family: Inter, sans-serif; font-weight: 600"
                    >
                      {useCase.title}
                    </h4>
                    {#if useCase.contributor || useCase.addedBy}
                      <div class="flex items-center gap-1.5 mb-2">
                        <div
                          class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#F3F4F6] rounded-full"
                        >
                          <svg class="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                          </svg>
                          <span
                            class="text-[11px] text-gray-700"
                            style="font-family: Inter, sans-serif; font-weight: 500"
                          >
                            {useCase.contributor || useCase.addedBy}
                          </span>
                        </div>
                      </div>
                    {/if}
                    <p
                      class="text-[13px] text-gray-600 mb-2"
                      style="font-family: Inter, sans-serif; font-weight: 400"
                    >
                      {useCase.description || useCase.summary}
                    </p>
                    <div class="bg-blue-50 border border-blue-100 rounded-md p-3 mt-2">
                      <span
                        class="text-[11px] text-blue-900 font-medium block mb-1"
                        style="font-family: Inter, sans-serif; font-weight: 600"
                      >
                        Why It Matters to the Client
                      </span>
                      {#if loadingWhyItMatters.has(useCase.id)}
                        <div class="space-y-2 animate-pulse">
                          <div class="h-3 bg-blue-200 rounded w-full"></div>
                          <div class="h-3 bg-blue-200 rounded w-3/4"></div>
                        </div>
                      {:else if whyItMattersErrors.has(useCase.id)}
                        <div class="flex items-center justify-between">
                          <p class="text-[12px] text-red-700" style="font-family: Inter, sans-serif; font-weight: 400">
                            Failed to generate. Please try again.
                          </p>
                          <button
                            onclick={() => fetchWhyItMatters(useCase)}
                            class="px-2 py-1 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 transition-colors"
                            style="font-family: Inter, sans-serif; font-weight: 500"
                          >
                            Retry
                          </button>
                        </div>
                      {:else if useCase.whyItMatters}
                        <p
                          class="text-[12px] text-blue-800"
                          style="font-family: Inter, sans-serif; font-weight: 400"
                        >
                          {useCase.whyItMatters}
                        </p>
                      {:else}
                        <p class="text-[12px] text-blue-400 italic" style="font-family: Inter, sans-serif; font-weight: 400">
                          Generating insights...
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Strategic Alignment -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)">
          <h3
            class="text-[16px] text-gray-900 mb-4"
            style="font-family: Inter, sans-serif; font-weight: 600"
          >
            Alignment with Client Strategic Pillars
          </h3>
          <p
            class="text-[13px] text-gray-600 mb-4"
            style="font-family: Inter, sans-serif; font-weight: 400"
          >
            The identified opportunities align with the following strategic pillars defined during pre-workshop setup:
          </p>
          <div class="flex flex-wrap gap-2">
            {#each strategicPillars as pillar}
              <div
                class="inline-flex items-center px-3 py-2 bg-[#F0F9F9] border border-[#C7E0DF] rounded-md"
              >
                <span
                  class="text-[12px] text-[#4A7A79]"
                  style="font-family: Inter, sans-serif; font-weight: 500"
                >
                  {pillar}
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Value vs Viability Chart -->
        <div class="bg-white rounded-lg border border-gray-200 p-6" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)">
          <h3
            class="text-[16px] text-gray-900 mb-4"
            style="font-family: Inter, sans-serif; font-weight: 600"
          >
            Value vs Viability Analysis
          </h3>
          <div class="relative bg-gray-50 border border-gray-200 rounded-lg p-8" style="height: 400px">
            <!-- Chart Quadrants -->
            <div class="absolute inset-8">
              <!-- Vertical center line -->
              <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
              <!-- Horizontal center line -->
              <div class="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>

              <!-- Quadrant Labels -->
              <div class="absolute top-2 left-2 text-[10px] text-gray-500" style="font-family: Inter, sans-serif; font-weight: 500">
                High Value / Low Viability
              </div>
              <div class="absolute top-2 right-2 text-[10px] text-gray-500 text-right" style="font-family: Inter, sans-serif; font-weight: 500">
                High Value / High Viability
              </div>
              <div class="absolute bottom-2 left-2 text-[10px] text-gray-500" style="font-family: Inter, sans-serif; font-weight: 500">
                Low Value / Low Viability
              </div>
              <div class="absolute bottom-2 right-2 text-[10px] text-gray-500 text-right" style="font-family: Inter, sans-serif; font-weight: 500">
                Low Value / High Viability
              </div>

              <!-- Data Points -->
              {#each rankedUseCases as useCase}
                {@const xPos = `${useCase.viability}%`}
                {@const yPos = `${100 - useCase.businessValue}%`}

                <div
                  class="absolute group"
                  style="left: {xPos}; top: {yPos}; transform: translate(-50%, -50%)"
                >
                  <div class="w-3 h-3 rounded-full bg-[#6B9695] border-2 border-white shadow-md"></div>
                  <div class="absolute left-4 top-0 bg-gray-900 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style="font-family: Inter, sans-serif; font-weight: 500">
                    {useCase.title}
                  </div>
                </div>
              {/each}
            </div>

            <!-- Axis Labels -->
            <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-[11px] text-gray-600" style="font-family: Inter, sans-serif; font-weight: 500">
              Implementation Viability →
            </div>
            <div class="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 -rotate-90 text-[11px] text-gray-600 whitespace-nowrap" style="font-family: Inter, sans-serif; font-weight: 500">
              Business Value →
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
