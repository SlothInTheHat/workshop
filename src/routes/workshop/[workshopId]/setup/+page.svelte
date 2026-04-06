<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const workshopId = $derived($page.params.workshopId);

  let currentStep = $state(1);
  let domain = $state('Oncology');
  let workflowDescription = $state('');
  let dataSensitivity = $state('Internal');
  let inviteEmail = $state('');
  let inviteRole = $state('Contributor');

  const participants = [
    { id: '1', name: 'Admin User', email: 'admin@optura.com', role: 'Owner', avatar: 'A', isYou: true },
    { id: '2', name: 'Sarah Johnson', email: 'facilitator@optura.com', role: 'Facilitator', avatar: 'S' },
    { id: '3', name: 'John Smith', email: 'contributor@client.com', role: 'Contributor', avatar: 'J' },
  ];

  const activityLog = [
    { icon: '✏️', text: 'AI System generated workshop context from stakeholder inputs', time: 'Just now' },
    { icon: '👤', text: 'Admin User invited someone as contributor', time: 'Just now' },
    { icon: '➕', text: 'Admin User created this workshop', time: '2 hours ago' },
    { icon: '📄', text: 'John Smith completed pre-workshop input', time: '1 hour ago' },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-purple-100 text-purple-700';
      case 'Facilitator': return 'bg-blue-100 text-blue-700';
      case 'Contributor': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const steps = ['Context', 'Participants', 'Pre-work', 'Launch'];
</script>

<div class="min-h-screen bg-[#FAFAF9]" style="font-family: Inter, sans-serif;">
  <!-- Header -->
  <div class="h-16 bg-[#fafafa] border-b border-[#E5E2DD] px-6 flex items-center justify-between">
    <a href="/" class="flex items-center hover:opacity-80 transition-opacity">
      <span class="text-[18px] font-bold text-gray-900 tracking-tight">optura</span>
    </a>
    <div class="flex items-center gap-3">
      <span class="text-[13px] text-gray-600 font-medium">New Workshop</span>
    </div>
    <div class="flex items-center gap-2">
      <a href="/" class="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px] font-medium">
        Cancel
      </a>
    </div>
  </div>

  <div class="max-w-5xl mx-auto px-8 py-8">
    <!-- Step Progress -->
    <div class="flex items-center justify-center mb-10 gap-2">
      {#each steps as step, i}
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold {i + 1 <= currentStep ? 'bg-[#6B9695] text-white' : 'bg-gray-200 text-gray-500'}">
              {#if i + 1 < currentStep}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {:else}
                {i + 1}
              {/if}
            </div>
            <span class="text-[13px] {i + 1 === currentStep ? 'text-gray-900 font-semibold' : 'text-gray-500'}">{step}</span>
          </div>
          {#if i < steps.length - 1}
            <div class="w-12 h-px bg-gray-300 mx-2"></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Main Form -->
      <div class="col-span-2 space-y-6">
        {#if currentStep === 1}
          <!-- Context Step -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-6">Workshop Context</h2>

            <div class="space-y-5">
              <div>
                <label class="block text-[13px] text-gray-700 font-medium mb-2">Workshop Title</label>
                <input
                  type="text"
                  value="Oncology Intake Redesign"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-[13px] text-gray-700 font-medium mb-2">Domain / Business Unit</label>
                <select bind:value={domain} class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
                  <option>Oncology</option>
                  <option>Clinical Ops</option>
                  <option>Care Coordination</option>
                  <option>Data & Analytics</option>
                </select>
              </div>

              <div>
                <label class="block text-[13px] text-gray-700 font-medium mb-2">Workflow Description</label>
                <textarea
                  bind:value={workflowDescription}
                  rows="4"
                  placeholder="Describe the workflows and pain points this workshop will focus on..."
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent resize-none placeholder:text-gray-400"
                ></textarea>
              </div>

              <div>
                <label class="block text-[13px] text-gray-700 font-medium mb-2">Data Sensitivity</label>
                <div class="flex gap-3">
                  {#each ['Internal', 'Restricted', 'Cross-Silo'] as level}
                    <button
                      onclick={() => dataSensitivity = level}
                      class="flex-1 py-2.5 rounded-lg border text-[13px] font-medium transition-colors {dataSensitivity === level ? 'bg-[#6B9695] text-white border-[#6B9695]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
                    >
                      {level}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B9695" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span class="text-[13px] text-[#6B9695] font-semibold">AI Analyst</span>
                </div>
                <p class="text-[13px] text-gray-700">Based on the domain and description, I've identified 3 key workflow areas to explore: patient intake, prior authorization, and EHR data sync. Shall I generate an initial context summary?</p>
              </div>
            </div>
          </div>

        {:else if currentStep === 2}
          <!-- Participants Step -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-6">Participants & Roles</h2>

            <div class="space-y-3 mb-6">
              {#each participants as p}
                <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-[13px] font-semibold text-gray-700">
                      {p.avatar}
                    </div>
                    <div>
                      <p class="text-[13px] text-gray-900 font-medium">{p.name} {p.isYou ? '(you)' : ''}</p>
                      <p class="text-[11px] text-gray-500">{p.email}</p>
                    </div>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium {getRoleBadgeColor(p.role)}">{p.role}</span>
                </div>
              {/each}
            </div>

            <div class="flex gap-2">
              <input
                type="email"
                bind:value={inviteEmail}
                placeholder="Email address"
                class="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent placeholder:text-gray-400"
              />
              <select bind:value={inviteRole} class="px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] bg-white">
                <option>Contributor</option>
                <option>Facilitator</option>
                <option>Viewer</option>
              </select>
              <button class="px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium">
                Invite
              </button>
            </div>
          </div>

        {:else if currentStep === 3}
          <!-- Pre-work Step -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-2">Pre-Workshop Assignment</h2>
            <p class="text-[13px] text-gray-500 mb-6">Contributors complete these sections before the workshop begins.</p>

            <div class="space-y-4">
              {#each [
                { label: 'Current State', placeholder: 'Describe your current workflow...' },
                { label: 'Key Pain Points', placeholder: 'What are the biggest bottlenecks?' },
                { label: 'Data Sources Used', placeholder: 'List the systems and data sources involved...' },
                { label: 'Previous Solutions Tried', placeholder: 'What has been attempted before?' },
                { label: 'Ideal Future State', placeholder: 'Describe your ideal workflow outcome...' },
              ] as section}
                <div>
                  <label class="block text-[13px] text-gray-700 font-medium mb-1.5">{section.label}</label>
                  <textarea
                    rows="2"
                    placeholder={section.placeholder}
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] resize-none placeholder:text-gray-400"
                  ></textarea>
                </div>
              {/each}
            </div>
          </div>

        {:else}
          <!-- Launch Step -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-[18px] text-gray-900 font-semibold mb-2">Ready to Launch</h2>
            <p class="text-[13px] text-gray-500 mb-6">Review your workshop setup before going live.</p>

            <div class="space-y-4 mb-6">
              {#each [
                { label: 'Title', value: 'Oncology Intake Redesign' },
                { label: 'Domain', value: 'Clinical Ops / Oncology' },
                { label: 'Participants', value: '3 invited' },
                { label: 'Pre-work', value: '5 sections configured' },
                { label: 'Data Sensitivity', value: dataSensitivity },
              ] as item}
                <div class="flex items-center">
                  <span class="text-[13px] text-gray-500 min-w-[140px] font-normal">{item.label}</span>
                  <span class="text-[13px] text-gray-900 font-medium">{item.value}</span>
                </div>
              {/each}
            </div>

            <div class="bg-[#D1FAE5] border border-green-200 rounded-lg p-4 mb-6">
              <p class="text-[13px] text-green-800 font-medium">All checks passed — workshop is ready to go live.</p>
            </div>

            <button
              onclick={() => goto(`/workshop/${workshopId}/live`)}
              class="w-full py-3 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[14px] font-semibold"
            >
              Launch Workshop
            </button>
          </div>
        {/if}

        <!-- Navigation -->
        <div class="flex items-center justify-between">
          <button
            onclick={() => { if (currentStep > 1) currentStep--; else goto('/'); }}
            class="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px] font-medium"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          {#if currentStep < 4}
            <button
              onclick={() => currentStep++}
              class="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px] font-medium"
            >
              Continue
            </button>
          {/if}
        </div>
      </div>

      <!-- Activity Sidebar -->
      <div class="space-y-4">
        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-[13px] text-gray-900 font-semibold mb-4">Activity</h3>
          <div class="space-y-3">
            {#each activityLog as entry}
              <div class="flex items-start gap-2.5">
                <span class="text-base mt-0.5">{entry.icon}</span>
                <div>
                  <p class="text-[12px] text-gray-700 font-normal leading-relaxed">{entry.text}</p>
                  <p class="text-[11px] text-gray-400 mt-0.5">{entry.time}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-5">
          <h3 class="text-[13px] text-gray-900 font-semibold mb-3">Agenda</h3>
          <div class="space-y-2">
            {#each ['Current State', 'Pain Points', 'AI Opportunities', 'Viability Assessment'] as item, i}
              <div class="flex items-center gap-2 py-1.5">
                <div class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] {i === 1 ? 'bg-[#6B9695] text-white' : 'bg-gray-100 text-gray-500'} font-semibold shrink-0">
                  {i + 1}
                </div>
                <span class="text-[13px] {i === 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}">{item}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
