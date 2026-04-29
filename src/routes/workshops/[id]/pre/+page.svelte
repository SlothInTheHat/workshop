<script lang="ts">
  import type { PageData } from './$types';
  import jsPDF from 'jspdf';
  import { onMount, onDestroy } from 'svelte';

  let { data }: { data: PageData } = $props();

  let workshop = $state(data.workshop);
  let participants = $state(data.participants);
  let artifacts = $state(data.artifacts);
  let activityLog = $state(data.activityLog);
  let stats = $state(data.stats);
  const { session } = $derived(data);

  let activeTab = $state<'overview' | 'participants' | 'artifacts' | 'context' | 'teams'>('overview');

  // Add participant
  let addingParticipant = $state(false);
  let newName = $state('');
  let newEmail = $state('');
  let newRole = $state('contributor');
  let addError = $state('');

  // Artifact upload
  let artifactTitle = $state('');
  let artifactUrl = $state('');
  let artifactType = $state('document');
  let artifactVisibility = $state('all');
  let addingArtifact = $state(false);
  let artifactError = $state('');

  // AI Context
  let generatingContext = $state(false);
  let contextError = $state('');
  let editableContext = $state(workshop.aiContext ?? '');
  let savingContext = $state(false);
  let contextSaved = $state(false);

  // Strategic Pillars & Kickoff Summary
  let generatingPillars = $state(false);
  let pillarsError = $state('');
  let generatingSummary = $state(false);
  let summaryError = $state('');
  let newPillar = $state('');

  let launching = $state(false);
  let newTeamName = $state('');

  const overallProgress = $derived(
    stats.contributorCount > 0
      ? Math.round((stats.submittedCount / stats.contributorCount) * 100)
      : 0
  );

  async function refreshData() {
    try {
      const res = await fetch(`/api/workshops/${workshop.id}`);
      if (!res.ok) return;
      const d = await res.json();
      participants = d.participants ?? participants;
      activityLog = d.activityLog ?? activityLog;
      // Recompute stats
      const contributors = (d.participants ?? []).filter((p: any) => p.role === 'contributor');
      const submitted = (d.inputs ?? []).filter((i: any) => i.status === 'completed').length;
      stats = {
        ...stats,
        participantCount: (d.participants ?? []).length,
        contributorCount: contributors.length,
        submittedCount: submitted,
      };
    } catch {}
  }

  let pollTimer: ReturnType<typeof setInterval>;
  onMount(() => {
    pollTimer = setInterval(refreshData, 5000);
  });
  onDestroy(() => clearInterval(pollTimer));

  const roleBadgeColor = (role: string) => {
    if (role === 'facilitator') return 'bg-blue-100 text-blue-700';
    if (role === 'executive') return 'bg-purple-100 text-purple-700';
    return 'bg-green-100 text-green-700';
  };

  const roleLabel = (role: string) => {
    if (role === 'facilitator') return 'Facilitator';
    if (role === 'executive') return 'Executive';
    return 'Contributor';
  };

  const statusColor = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-700';
    if (s === 'in_progress') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-500';
  };

  const statusLabel = (s: string) => {
    if (s === 'completed') return 'Submitted';
    if (s === 'in_progress') return 'In Progress';
    return 'Pending';
  };

  const actionIcon = (action: string) => {
    if (action === 'workshop_created') return '+';
    if (action === 'participant_added') return '•';
    if (action === 'participant_removed') return '×';
    if (action === 'input_submitted') return '•';
    if (action === 'artifact_uploaded') return '•';
    if (action === 'context_generated') return '•';
    if (action === 'workshop_launched') return '•';
    return '•';
  };

  const actionText = (action: string) => {
    const labels: Record<string, string> = {
      workshop_created: 'Workshop created',
      participant_added: 'Participant added',
      participant_removed: 'Participant removed',
      input_submitted: 'Input submitted',
      artifact_uploaded: 'Artifact uploaded',
      context_generated: 'AI context generated',
      workshop_launched: 'Workshop launched'
    };
    return labels[action] ?? action;
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  async function addParticipant() {
    if (!newName.trim()) { addError = 'Name is required'; return; }
    addError = '';
    addingParticipant = true;
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() || undefined, role: newRole, actorName: session.name })
      });
      if (!res.ok) {
        addError = 'Failed to add participant';
      } else {
        const p = await res.json() as typeof participants[0];
        participants = [...participants, { ...p, inputStatus: 'pending', completionPct: 0 }];
        if (newRole === 'contributor') stats = { ...stats, contributorCount: stats.contributorCount + 1 };
        activityLog = [{ id: crypto.randomUUID(), workshopId: workshop.id, tenantId: workshop.tenantId, actorName: session.name, action: 'participant_added', details: `Added ${newName} as ${newRole}`, createdAt: new Date() }, ...activityLog];
        newName = '';
        newEmail = '';
        newRole = 'contributor';
      }
    } finally {
      addingParticipant = false;
    }
  }

  async function removeParticipant(pid: string, name: string) {
    if (!confirm(`Remove ${name} from the workshop?`)) return;
    const res = await fetch(`/api/workshops/${workshop.id}/participants/${pid}`, { method: 'DELETE' });
    if (res.ok) {
      const removed = participants.find(p => p.id === pid);
      participants = participants.filter(p => p.id !== pid);
      if (removed?.role === 'contributor') stats = { ...stats, contributorCount: Math.max(0, stats.contributorCount - 1) };
    }
  }

  async function uploadArtifact() {
    if (!artifactTitle.trim()) { artifactError = 'Title is required'; return; }
    if (!artifactUrl.trim()) { artifactError = 'URL is required'; return; }
    artifactError = '';
    addingArtifact = true;
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: artifactTitle.trim(), storageUrl: artifactUrl.trim(), type: artifactType, visibility: artifactVisibility, uploadedBy: session.name })
      });
      if (!res.ok) { artifactError = 'Failed to add artifact'; }
      else {
        const a = await res.json();
        artifacts = [...artifacts, a];
        activityLog = [{ id: crypto.randomUUID(), workshopId: workshop.id, tenantId: workshop.tenantId, actorName: session.name, action: 'artifact_uploaded', details: `"${artifactTitle}"`, createdAt: new Date() }, ...activityLog];
        artifactTitle = '';
        artifactUrl = '';
        artifactType = 'document';
      }
    } finally {
      addingArtifact = false;
    }
  }

  async function deleteArtifact(id: string) {
    const res = await fetch(`/api/workshops/${workshop.id}/artifacts?artifactId=${id}`, { method: 'DELETE' });
    if (res.ok) artifacts = artifacts.filter(a => a.id !== id);
  }

  async function generateContext() {
    generatingContext = true;
    contextError = '';
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorName: session.name })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        contextError = (e as { message?: string }).message ?? 'Failed to generate context';
      } else {
        const result = await res.json() as { aiContext: string };
        editableContext = result.aiContext;
        workshop = { ...workshop, aiContext: result.aiContext };
        activityLog = [{ id: crypto.randomUUID(), workshopId: workshop.id, tenantId: workshop.tenantId, actorName: session.name, action: 'context_generated', details: `From ${stats.submittedCount} input(s)`, createdAt: new Date() }, ...activityLog];
      }
    } finally {
      generatingContext = false;
    }
  }

  async function saveContext() {
    savingContext = true;
    contextSaved = false;
    await fetch(`/api/workshops/${workshop.id}/context`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiContext: editableContext })
    });
    workshop = { ...workshop, aiContext: editableContext };
    savingContext = false;
    contextSaved = true;
    setTimeout(() => { contextSaved = false; }, 2000);
  }

  async function generatePillars() {
    if (stats.submittedCount === 0) {
      pillarsError = 'Need at least one submitted contributor input';
      return;
    }
    generatingPillars = true;
    pillarsError = '';
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/pillars/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        pillarsError = (e as { message?: string }).message ?? 'Failed to generate pillars';
      } else {
        const result = await res.json() as { pillars: string[] };
        workshop = { ...workshop, strategicPillars: result.pillars };
        activityLog = [{ id: crypto.randomUUID(), workshopId: workshop.id, tenantId: workshop.tenantId, actorName: session.name, action: 'pillars_generated', details: `Generated ${result.pillars.length} pillars`, createdAt: new Date() }, ...activityLog];
      }
    } finally {
      generatingPillars = false;
    }
  }

  async function addPillar() {
    if (!newPillar.trim()) return;
    const updated = [...(workshop.strategicPillars ?? []), newPillar.trim()];
    newPillar = '';
    await savePillars(updated);
  }

  async function removePillar(pillar: string) {
    const updated = (workshop.strategicPillars ?? [])
      .filter(p => p !== pillar);
    await savePillars(updated);
  }

  async function savePillars(pillars: string[]) {
    workshop = { ...workshop, strategicPillars: pillars };
    await fetch(`/api/workshops/${workshop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategicPillars: pillars })
    });
  }

  async function generateSummary() {
    if (stats.submittedCount === 0) {
      summaryError = 'Need at least one submitted contributor input';
      return;
    }
    generatingSummary = true;
    summaryError = '';
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorName: session.name })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        summaryError = (e as { message?: string }).message ?? 'Failed to generate summary';
      } else {
        const result = await res.json() as { kickoffSummary: string };
        workshop = { ...workshop, kickoffSummary: result.kickoffSummary };
        activityLog = [{ id: crypto.randomUUID(), workshopId: workshop.id, tenantId: workshop.tenantId, actorName: session.name, action: 'summary_generated', details: 'Generated kickoff summary', createdAt: new Date() }, ...activityLog];
      }
    } finally {
      generatingSummary = false;
    }
  }

  function downloadSummary() {
    if (!workshop.kickoffSummary) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Kickoff Summary', 20, yPos);
    yPos += 10;

    // Workshop Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(workshop.title, 20, yPos);
    yPos += 15;

    // Summary Content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Split summary into paragraphs
    const paragraphs = workshop.kickoffSummary.split('\n\n');

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      const lines = doc.splitTextToSize(paragraph, maxWidth);

      for (const line of lines) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      }

      yPos += 4; // Extra space between paragraphs
    }

    // Download
    const filename = `${workshop.title.replace(/[^a-z0-9]/gi, '_')}_kickoff_summary.pdf`;
    doc.save(filename);
  }

  async function addTeam() {
    if (!newTeamName.trim()) return;
    const updated = [
      ...(workshop.teams ?? []),
      { name: newTeamName.trim() }
    ];
    newTeamName = '';
    workshop = { ...workshop, teams: updated };
    await fetch(`/api/workshops/${workshop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams: updated })
    });
  }

  async function removeTeam(name: string) {
    const updated = (workshop.teams ?? [])
      .filter(t => t.name !== name);
    workshop = { ...workshop, teams: updated };
    await fetch(`/api/workshops/${workshop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams: updated })
    });
  }

  async function launchWorkshop() {
    if (!confirm('Move this workshop to the live phase? Contributors will no longer be able to edit their inputs.')) return;
    launching = true;
    const res = await fetch(`/api/workshops/${workshop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'live', actorName: session.name })
    });
    if (res.ok) {
      workshop = { ...workshop, status: 'live' };
      // Redirect to live workshop
      window.location.href = `/workshop/${workshop.id}/live`;
    }
    launching = false;
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
  <title>{workshop.title} — Pre-Workshop — Optura</title>
</svelte:head>

<div class="min-h-[calc(100vh-64px)] bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
  <div class="max-w-5xl mx-auto px-8 py-8">

    <!-- Breadcrumb + Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <div class="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <a href="/workshops" class="hover:text-gray-700 transition-colors">Workshops</a>
          <span>/</span>
          <span class="text-gray-900">Pre-Workshop</span>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-[22px] text-gray-900 font-bold">{workshop.title}</h1>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {workshop.status === 'live' ? 'bg-[#D1FAE5] text-green-800' : 'bg-blue-50 text-blue-700'}">
            {workshop.status === 'live' ? 'Live' : 'Pre-Workshop'}
          </span>
          {#if workshop.dataSensitivity === 'phi'}
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">Contains PHI</span>
          {/if}
        </div>
        {#if workshop.focusArea}
          <p class="text-[13px] text-gray-500 mt-1">{workshop.focusArea}</p>
        {/if}
      </div>

      {#if workshop.status === 'pre'}
        <button
          onclick={launchWorkshop}
          disabled={launching}
          class="flex items-center gap-2 px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
        >
          {launching ? 'Launching...' : 'Launch Workshop'}
        </button>
      {:else}
        <a href="/workshop/{workshop.id}/live" class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[13px] font-medium transition-colors">
          Enter Live Workshop
        </a>
      {/if}
    </div>

    <!-- Stats strip -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      {#each [
        { label: 'Participants', value: participants.length },
        { label: 'Contributors', value: stats.contributorCount },
        { label: 'Submitted', value: stats.submittedCount },
        { label: 'Artifacts', value: artifacts.length },
      ] as s}
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-[12px] text-gray-500 mb-0.5">{s.label}</p>
          <p class="text-xl text-gray-900 font-semibold">{s.value}</p>
        </div>
      {/each}
    </div>

    <!-- Progress bar -->
    {#if stats.contributorCount > 0}
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[13px] text-gray-700 font-medium">Contributor Input Progress</span>
          <span class="text-[13px] text-gray-900 font-semibold">{stats.submittedCount}/{stats.contributorCount} submitted ({overallProgress}%)</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-[#6B9695] rounded-full transition-all duration-500" style="width: {overallProgress}%"></div>
        </div>
      </div>
    {/if}

    <!-- 2-col layout: main tabs + activity sidebar -->
    <div class="grid grid-cols-3 gap-6">
      <!-- Main content -->
      <div class="col-span-2 space-y-0">
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <!-- Tab nav -->
          <div class="flex border-b border-gray-200">
            {#each [
              { id: 'overview', label: 'Overview' },
              { id: 'participants', label: `Participants (${participants.length})` },
              { id: 'teams', label: 'Teams' },
            ] as tab}
              <button
                onclick={() => activeTab = tab.id as typeof activeTab}
                class="px-4 py-3 text-[13px] font-medium transition-colors border-b-2 {activeTab === tab.id ? 'border-[#6B9695] text-[#6B9695]' : 'border-transparent text-gray-500 hover:text-gray-700'}"
              >
                {tab.label}
              </button>
            {/each}
          </div>

          <div class="p-6">

            <!-- OVERVIEW -->
            {#if activeTab === 'overview'}
              {#if workshop.objective}
                <div class="mb-6">
                  <label class="block text-[13px] text-gray-700 font-medium mb-1.5">Objective</label>
                  <p class="text-[13px] text-gray-600">{workshop.objective}</p>
                </div>
              {/if}

              <!-- Strategic Pillars -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-[13px] text-gray-700 font-medium">Strategic Pillars</label>
                </div>

                <div class="flex gap-2 mb-3">
                  <input
                    type="text"
                    bind:value={newPillar}
                    placeholder="Add a pillar..."
                    onkeydown={(e) => e.key === 'Enter' && addPillar()}
                    class="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#6B9695]"
                  />
                  <button
                    onclick={addPillar}
                    class="px-3 py-1.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[11px] font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onclick={generatePillars}
                    disabled={generatingPillars || stats.submittedCount === 0}
                    class="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
                  >
                    {generatingPillars ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>

                {#if workshop.strategicPillars && workshop.strategicPillars.length > 0}
                  <div class="flex flex-wrap gap-2">
                    {#each workshop.strategicPillars as pillar}
                      <span class="flex items-center gap-1 px-3 py-1.5 bg-[#E6F4F4] text-[#6B9695] rounded-full text-[12px] font-medium">
                        {pillar}
                        <button
                          onclick={() => removePillar(pillar)}
                          class="ml-1 text-[#6B9695] hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    {/each}
                  </div>
                {:else}
                  <p class="text-[12px] text-gray-400">
                    No pillars yet. Add manually or use AI Generate
                    (requires contributor submissions).
                  </p>
                {/if}
              </div>

              <!-- Kickoff Summary -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-[13px] text-gray-700 font-medium">Kickoff Summary</label>
                  <div class="flex gap-2">
                    {#if workshop.kickoffSummary}
                      <button
                        onclick={downloadSummary}
                        class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        Download
                      </button>
                    {/if}
                    <button
                      onclick={generateSummary}
                      disabled={generatingSummary || stats.submittedCount === 0}
                      class="px-3 py-1.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
                    >
                      {generatingSummary ? 'Generating...' : workshop.kickoffSummary ? 'Regenerate' : 'Generate Summary'}
                    </button>
                  </div>
                </div>
                {#if summaryError}
                  <p class="text-[12px] text-red-600 mb-2">{summaryError}</p>
                {/if}
                {#if workshop.kickoffSummary}
                  <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-4">
                    <p class="text-[13px] text-gray-700 whitespace-pre-line">{workshop.kickoffSummary}</p>
                  </div>
                {:else}
                  <p class="text-[12px] text-gray-400 italic">Generate a comprehensive kickoff summary from all contributor inputs</p>
                {/if}
              </div>

              <h3 class="text-[18px] text-gray-900 font-semibold mb-4">Contributor Status</h3>
              <div class="space-y-2">
                {#each participants.filter(p => p.role === 'contributor') as p}
                  <div class="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div class="w-8 h-8 rounded-full bg-[#E6F4F4] flex items-center justify-center text-[13px] font-semibold text-[#6B9695] flex-shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-[13px] font-medium text-gray-900">{p.name}</span>
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {statusColor(p.inputStatus)}">
                          {statusLabel(p.inputStatus)}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div class="h-full bg-[#6B9695] rounded-full" style="width: {p.completionPct}%"></div>
                        </div>
                        <span class="text-[11px] text-gray-400 flex-shrink-0">{p.completionPct}%</span>
                      </div>
                    </div>
                  </div>
                {/each}
                {#if participants.filter(p => p.role === 'contributor').length === 0}
                  <p class="text-[13px] text-gray-400 italic">No contributors yet — add them in the Participants tab.</p>
                {/if}
              </div>

            <!-- PARTICIPANTS -->
            {:else if activeTab === 'participants'}
              <h2 class="text-[18px] text-gray-900 font-semibold mb-6">Participants & Roles</h2>

              <!-- Current list -->
              {#if participants.length > 0}
                <div class="space-y-1 mb-6">
                  {#each participants as p}
                    <div class="py-3 border-b border-gray-100 last:border-0">
                      <div class="flex items-center justify-between mb-2">
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
                        <div class="flex items-center gap-3">
                          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {roleBadgeColor(p.role)}">{roleLabel(p.role)}</span>
                          {#if p.role === 'contributor'}
                            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {statusColor(p.inputStatus)}">{statusLabel(p.inputStatus)}</span>
                          {/if}
                          <button onclick={() => removeParticipant(p.id, p.name)} class="text-gray-300 hover:text-red-400 transition-colors ml-1 text-[12px]">
                            Remove
                          </button>
                        </div>
                      </div>

                      {#if p.role === 'contributor'}
                        <div class="ml-11 flex items-center gap-3">
                          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              class="h-full rounded-full transition-all duration-500 {p.completionPct === 100 ? 'bg-green-500' : p.completionPct > 0 ? 'bg-amber-500' : 'bg-gray-300'}"
                              style="width: {p.completionPct}%"
                            ></div>
                          </div>
                          <span class="text-[11px] text-gray-500 font-medium min-w-[3ch] text-right">{p.completionPct}%</span>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              {#if addError}
                <p class="text-[13px] text-red-600 mb-2">{addError}</p>
              {/if}
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
                  disabled={addingParticipant || !newName.trim()}
                  class="px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50"
                >
                  Add
                </button>
              </div>

            <!-- TEAMS -->
            {:else if activeTab === 'teams'}
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-[15px] font-semibold text-gray-900">
                      Breakout Teams
                    </h3>
                    <p class="text-[12px] text-gray-500 mt-0.5">
                      Configure teams before launching the workshop
                    </p>
                  </div>
                </div>

                <!-- Add team form -->
                <div class="flex gap-2">
                  <input
                    type="text"
                    bind:value={newTeamName}
                    placeholder="Team name (e.g. Team Alpha)"
                    onkeydown={(e) => e.key === 'Enter' && addTeam()}
                    class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#6B9695]"
                  />
                  <button
                    onclick={addTeam}
                    class="px-4 py-2 bg-[#6B9695] text-white rounded-lg text-[13px] font-medium hover:bg-[#5A8584] transition-colors"
                  >
                    Add Team
                  </button>
                </div>

                <!-- Teams list -->
                {#if workshop.teams && workshop.teams.length > 0}
                  <div class="space-y-2">
                    {#each workshop.teams as team}
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span class="text-[13px] font-medium text-gray-900">
                          {team.name}
                        </span>
                        <button
                          onclick={() => removeTeam(team.name)}
                          class="text-gray-400 hover:text-red-500 transition-colors text-[16px]"
                        >×</button>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-[12px] text-gray-400 py-4 text-center">
                    No teams yet. Add at least 2 teams before launching.
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">

        <!-- Access Codes -->
        {#if workshop.facilitatorCode || workshop.contributorCode}
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="text-[13px] text-gray-900 font-semibold mb-3">Access Links</h3>
            <p class="text-[11px] text-gray-400 mb-4">Share these links with participants to join the workshop</p>
            <div class="space-y-3">
              {#if workshop.facilitatorCode}
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p class="text-[11px] text-blue-600 font-medium mb-1.5">Facilitator Link</p>
                  <div class="bg-white border border-blue-200 rounded p-2 mb-2 break-all">
                    <p class="text-[11px] text-blue-800 font-mono">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/join?code={workshop.facilitatorCode}
                    </p>
                  </div>
                  <button
                    onclick={() => copyToClipboard((typeof window !== 'undefined' ? window.location.origin : '') + '/join?code=' + (workshop.facilitatorCode ?? ''))}
                    class="w-full px-2.5 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded text-[11px] font-medium transition-colors"
                  >Copy Link</button>
                </div>
              {/if}
              {#if workshop.contributorCode}
                <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-3">
                  <p class="text-[11px] text-[#6B9695] font-medium mb-1.5">Contributor Link</p>
                  <div class="bg-white border border-[#6B9695]/30 rounded p-2 mb-2 break-all">
                    <p class="text-[11px] text-[#4A7B7A] font-mono">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/join?code={workshop.contributorCode}
                    </p>
                  </div>
                  <button
                    onclick={() => copyToClipboard((typeof window !== 'undefined' ? window.location.origin : '') + '/join?code=' + (workshop.contributorCode ?? ''))}
                    class="w-full px-2.5 py-1.5 bg-white border border-[#6B9695]/30 text-[#6B9695] hover:bg-[#F0F9F9] rounded text-[11px] font-medium transition-colors"
                  >Copy Link</button>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-[13px] text-gray-900 font-semibold mb-4">Activity</h3>
          <div class="space-y-3">
            {#if activityLog.length === 0}
              <p class="text-[12px] text-gray-400">No activity yet</p>
            {:else}
              {#each activityLog as log}
                <div class="flex items-start gap-2.5">
                  <span class="text-base mt-0.5">{actionIcon(log.action)}</span>
                  <div>
                    <p class="text-[12px] text-gray-700 leading-relaxed">{log.details || actionText(log.action)}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{log.actorName} · {formatTime(log.createdAt)}</p>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-[13px] text-gray-900 font-semibold mb-3">Checklist</h3>
          <div class="space-y-2">
            {#each [
              { label: 'Participants added', done: participants.length > 0 },
              { label: 'Inputs submitted', done: stats.submittedCount > 0 },
              { label: 'Artifacts uploaded', done: artifacts.length > 0 },
              { label: 'AI context generated', done: !!workshop.aiContext },
            ] as item}
              <div class="flex items-center gap-2 py-1">
                <span class="text-sm">{item.done ? '•' : '○'}</span>
                <span class="text-[13px] {item.done ? 'text-gray-900 font-medium' : 'text-gray-500'}">{item.label}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
