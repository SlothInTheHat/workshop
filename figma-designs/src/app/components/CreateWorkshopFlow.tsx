import { useState } from 'react';
import { Info, Shield, Crown, User, Pencil, Trash2, Calendar, Check, Sparkles, ChevronDown, ArrowDown, X, Lightbulb, Save } from 'lucide-react';
import logo from 'figma:asset/9832ddf9258f642ca77be19766503a9da1a8954b.png';

interface CreateWorkshopFlowProps {
  onLaunchWorkshop: () => void;
  onCancel: () => void;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Facilitator' | 'Contributor' | 'Viewer';
  avatar: string;
  isYou?: boolean;
}

interface ContributorStatus {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  progress: number;
  updatedTime: string;
}

interface ActivityLogEntry {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export function CreateWorkshopFlow({ onLaunchWorkshop, onCancel }: CreateWorkshopFlowProps) {
  const [isContributorView, setIsContributorView] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Contributor');
  const [showImportThemes, setShowImportThemes] = useState(true);
  const [domain, setDomain] = useState('Oncology');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [dataSensitivity, setDataSensitivity] = useState('Internal');

  // Contributor view states
  const [section1, setSection1] = useState('');
  const [section2, setSection2] = useState('');
  const [section3, setSection3] = useState('');
  const [section4, setSection4] = useState('');
  const [section5, setSection5] = useState('');

  const participants: Participant[] = [
    { id: '1', name: 'Admin User', email: 'admin@optura.com', role: 'Owner', avatar: 'A', isYou: true },
    { id: '2', name: 'Sarah Johnson', email: 'facilitator@optura.com', role: 'Facilitator', avatar: 'S' },
    { id: '3', name: 'John Smith', email: 'contributor@client.com', role: 'Contributor', avatar: 'J' },
  ];

  const contributorStatuses: ContributorStatus[] = [
    { id: '1', name: 'John Smith', email: 'contributor@client.com', avatar: 'J', status: 'Completed', progress: 100, updatedTime: '2 hours ago' },
    { id: '2', name: 'Emily Chen', email: 'emily@client.com', avatar: 'E', status: 'In Progress', progress: 60, updatedTime: '1 day ago' },
    { id: '3', name: 'Michael Brown', email: 'michael@client.com', avatar: 'M', status: 'Pending', progress: 0, updatedTime: 'Not started' },
    { id: '4', name: 'someone', email: 'someone@client.com', avatar: 'S', status: 'Pending', progress: 0, updatedTime: 'Not started' },
  ];

  const activityLog: ActivityLogEntry[] = [
    { id: '1', icon: '✏️', text: 'AI System generated workshop context from stakeholder inputs', time: 'Just now' },
    { id: '2', icon: '👤', text: 'Admin User invited someone as contributor', time: 'Just now' },
    { id: '3', icon: '➕', text: 'Admin User created this workshop', time: '2 hours ago' },
    { id: '4', icon: '👤', text: 'Admin User assigned Sarah Johnson as Facilitator', time: '2 hours ago' },
    { id: '5', icon: '📄', text: 'John Smith completed pre-workshop input', time: '1 hour ago' },
    { id: '6', icon: '✏️', text: 'Sarah Johnson updated workflow description', time: '30 minutes ago' },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-purple-100 text-purple-700';
      case 'Facilitator': return 'bg-blue-100 text-blue-700';
      case 'Contributor': return 'bg-green-100 text-green-700';
      case 'Viewer': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner': return <Crown className="w-3 h-3" />;
      case 'Facilitator': return <User className="w-3 h-3" />;
      case 'Contributor': return <Pencil className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">✅ Completed</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">🟠 In Progress</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">⏱ Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Global Nav */}
      <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
        <button className="flex items-center hover:opacity-80 transition-opacity">
          <img src={logo} alt="Optura" className="h-10" />
        </button>

        <nav className="flex items-center gap-6">
          <button className="text-sm font-medium text-gray-900">Workshop</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Use Cases</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Agency</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Reports</button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsContributorView(!isContributorView)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isContributorView
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Contributor View
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            Optura-Led
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold">
            A
          </div>
        </div>
      </div>

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[860px] mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white font-semibold text-sm">
                ✓
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Participants & Input</div>
              </div>
            </div>

            {/* Line */}
            <div className="flex-1 h-0.5 bg-green-500 mx-4" />

            {/* Step 2 */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white font-semibold text-sm">
                ✓
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">AI Context Generation</div>
              </div>
            </div>

            {/* Line */}
            <div className="flex-1 h-0.5 bg-gray-300 mx-4" />

            {/* Step 3 */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold text-sm">
                3
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Review & Launch</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single Scrollable Page */}
      <div className="max-w-[860px] mx-auto py-8 px-4 pb-32">
        {isContributorView ? (
          // CONTRIBUTOR VIEW
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Pre-Workshop Input</h1>
              <p className="text-sm text-gray-600">Share your insights to help prepare for a productive workshop session</p>
            </div>

            {/* Pre-Workshop Completion */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Pre-Workshop Completion</h3>
                  <p className="text-sm text-gray-600 mt-1">Track overall progress from all contributors</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">53%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full mb-4">
                <div className="w-[53%] h-3 bg-gray-900 rounded-full" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">1</span>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-700">1</span>
                  <span className="text-sm text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-700">1</span>
                  <span className="text-sm text-gray-600">Not Started</span>
                </div>
              </div>
            </div>

            {/* Guidance from Workshop Facilitator */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Guidance from Workshop Facilitator</h3>
                  <p className="text-sm text-gray-600 mt-1">Complete these items to help prepare for a productive workshop session</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Share your current workflow</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Priority</span>
                      </div>
                      <p className="text-sm text-gray-600">Help us understand your day-to-day processes and pain points</p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Define success criteria</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Priority</span>
                      </div>
                      <p className="text-sm text-gray-600">What would make this workshop valuable for you?</p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">List technical constraints</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">Important</span>
                      </div>
                      <p className="text-sm text-gray-600">Any system limitations or compliance requirements we should know</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Input Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Your Input Progress</h3>
                  <p className="text-sm text-gray-600 mt-1">0 of 5 sections completed</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">0%</div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="w-0 h-2 bg-gray-900 rounded-full" />
              </div>
            </div>

            {/* Section 1 - Goals & Objectives */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Section 1</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Required</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Goals & Objectives</h3>
              <p className="text-sm text-gray-600 mb-4">What do you hope to achieve from this workshop?</p>
              <textarea
                value={section1}
                onChange={(e) => setSection1(e.target.value)}
                placeholder="Describe your primary goals and what success looks like for you..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">{section1.length} characters</div>
            </div>

            {/* Section 2 - Pain Points & Challenges */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Section 2</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Required</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Pain Points & Challenges</h3>
              <p className="text-sm text-gray-600 mb-4">What current challenges are you facing?</p>
              <textarea
                value={section2}
                onChange={(e) => setSection2(e.target.value)}
                placeholder="Share specific pain points, bottlenecks, or obstacles in your current processes..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">{section2.length} characters</div>
            </div>

            {/* Section 3 - Current Workflow Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Section 3</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Current Workflow Notes</h3>
              <p className="text-sm text-gray-600 mb-4">Describe your existing workflow or process</p>
              <textarea
                value={section3}
                onChange={(e) => setSection3(e.target.value)}
                placeholder="Walk us through your current workflow, including tools, steps, and stakeholders involved..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">{section3.length} characters</div>
            </div>

            {/* Section 4 - Constraints & Limitations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Section 4</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Constraints & Limitations</h3>
              <p className="text-sm text-gray-600 mb-4">What limitations should we be aware of?</p>
              <textarea
                value={section4}
                onChange={(e) => setSection4(e.target.value)}
                placeholder="List any technical, regulatory, budget, or timeline constraints..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">{section4.length} characters</div>
            </div>

            {/* Section 5 - Expectations & Success Criteria */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Section 5</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Required</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Expectations & Success Criteria</h3>
              <p className="text-sm text-gray-600 mb-4">How will you measure the success of this workshop?</p>
              <textarea
                value={section5}
                onChange={(e) => setSection5(e.target.value)}
                placeholder="Define what a successful outcome looks like and any specific deliverables you expect..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">{section5.length} characters</div>
            </div>
          </div>
        ) : (
          // LEADER VIEW - Single Scrollable Page with All Steps
          <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Ownership inferred from assigned owner emails</div>
                  <div className="text-xs text-blue-700 mt-1">Workshop ownership is automatically determined by the email domain of the assigned Owner.</div>
                </div>
              </div>
            </div>

            {/* Pre-Workshop Completion Progress Bar */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Pre-Workshop Completion</h3>
                  <p className="text-sm text-gray-600 mt-1">Track overall progress from all contributors</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">53%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full mb-4">
                <div className="w-[53%] h-3 bg-gray-900 rounded-full" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">1</span>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-700">1</span>
                  <span className="text-sm text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-700">1</span>
                  <span className="text-sm text-gray-600">Not Started</span>
                </div>
              </div>
            </div>

            {/* STEP 1: Participants & Input */}
            <div className="bg-white rounded-lg shadow-sm p-8">

              {/* Add Participants */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Add Participants</h2>
                <p className="text-sm text-gray-600 mb-4">Invite stakeholders and assign roles for this workshop</p>

                {/* Access & Roles */}
                <div className="border border-gray-300 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Owner + Facilitator</span> can edit core setup. <span className="font-semibold">Contributors</span> submit structured input. <span className="font-semibold">Viewers</span> have read-only access.
                    </div>
                  </div>
                </div>

                {/* Invite Row */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Contributor</option>
                      <option>Facilitator</option>
                      <option>Viewer</option>
                    </select>
                    <Pencil className="w-3 h-3 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                    Invite
                  </button>
                </div>

                {/* Participant List */}
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                        {participant.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name} {participant.isYou && <span className="text-gray-500">— You</span>}
                        </div>
                        <div className="text-xs text-gray-600">{participant.email}</div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(participant.role)}`}>
                        {getRoleIcon(participant.role)}
                        {participant.role}
                      </div>
                      {!participant.isYou && (
                        <>
                          <button className="text-xs text-blue-600 hover:underline">Transfer Ownership</button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Collect Stakeholder Input */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Collect Stakeholder Input</h2>
                <p className="text-sm text-gray-600 mb-4">Contributors submit structured pre-work before the workshop</p>

                {/* Stakeholder Input Portal */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">Stakeholder Input Portal</div>
                  <div className="text-sm text-gray-600">Collect structured pre-work input from contributors before the workshop</div>
                </div>

                {/* Overall Completion */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                  <span className="text-sm text-gray-600">1 of 4 completed</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                  <div className="w-1/4 h-2 bg-gray-900 rounded-full" />
                </div>

                {/* Date Picker */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="mm/dd/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Input Sections */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">Input Sections</div>
                  <div className="space-y-1">
                    {['Goals & Objectives', 'Pain Points & Challenges', 'Current Workflow Notes', 'Constraints & Limitations', 'Expectations & Success Criteria'].map((section) => (
                      <div key={section} className="text-sm text-blue-700">• {section}</div>
                    ))}
                  </div>
                </div>

                {/* Contributor Status Cards */}
                <div className="space-y-3 mb-4">
                  {contributorStatuses.map((contributor) => (
                    <div key={contributor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                          {contributor.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{contributor.name}</div>
                          <div className="text-xs text-gray-600">{contributor.email}</div>
                          <div className="text-xs text-gray-500 mt-1">Updated {contributor.updatedTime}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(contributor.status)}
                          <button className="text-sm text-blue-600 hover:underline">View</button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className={`h-2 rounded-full ${contributor.status === 'Completed' ? 'bg-green-500' : contributor.status === 'In Progress' ? 'bg-orange-500' : 'bg-gray-300'}`} style={{ width: `${contributor.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Generate AI Summary Button */}
                <button className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                  Generate AI Summary from Inputs
                </button>
              </div>

              {/* Connector Node */}
              <div className="flex flex-col items-center py-6 space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-blue-600" />
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  AI Processing
                </div>
                <div className="text-sm text-gray-600">Context generated from stakeholder inputs</div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Context auto-populated below</span>
                </div>
              </div>
            </div>

            {/* STEP 2: AI Context Generation */}
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
              {/* AI-Generated Context Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">AI-Generated Context</h2>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">Editable</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
              <p className="text-sm text-gray-600 -mt-2">Context auto-populated from stakeholder inputs. Adjust as needed.</p>

              {/* Import Themes Banner */}
              {showImportThemes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-blue-900">
                        Previous Oncology workshop identified 4 finalized themes. Would you like to reference them?
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                          Import Themes
                        </button>
                        <button className="px-4 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100">
                          Start Fresh
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setShowImportThemes(false)} className="p-1 hover:bg-blue-100 rounded">
                      <X className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </div>
              )}

              {/* AI-Suggested Domain */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-900">AI-Suggested Domain</label>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">Editable</span>
                </div>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Domain suggested based on participant roles and inputs</p>
              </div>

              {/* Primary Objective */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Primary Objective</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span className="text-sm text-gray-700">Improve patient intake</span>
                  </div>
                  <div className="flex items-start gap-2 ml-7">
                    <span className="text-sm text-gray-700">Reduce administrative burden</span>
                  </div>
                  <div className="flex items-start gap-2 ml-7">
                    <span className="text-sm text-gray-700">Improve diagnosis support</span>
                  </div>
                  <div className="flex items-start gap-2 ml-7">
                    <span className="text-sm text-gray-700">Optimize care coordination</span>
                  </div>
                  <button className="ml-7 text-sm text-blue-600 hover:underline">+ Add Custom Objective</button>
                </div>
              </div>

              {/* Current Workflow Description */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Current Workflow Description</label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Briefly describe the current clinical or operational workflow..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Data Sensitivity Level */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Data Sensitivity Level</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">Internal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    <span className="text-sm text-gray-700">Contains PHI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    <span className="text-sm text-gray-700">De-identified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Review & Launch */}
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Adjust Settings</h2>
                <p className="text-sm text-gray-600 mb-6">Final review before launching the workshop</p>

                {/* Invited Participants */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Invited Participants (4)</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Admin User', email: 'admin@optura.com', role: 'Owner', avatar: 'A' },
                      { name: 'Sarah Johnson', email: 'facilitator@optura.com', role: 'Facilitator', avatar: 'S' },
                      { name: 'John Smith', email: 'contributor@client.com', role: 'Contributor', avatar: 'J' },
                      { name: 'someone', email: 'someone@client.com', role: 'Contributor', avatar: 'S' },
                    ].map((participant, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                          {participant.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                          <div className="text-xs text-gray-600">{participant.email}</div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(participant.role as any)}`}>
                          {getRoleIcon(participant.role as any)}
                          {participant.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Log */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Activity Log</h3>
                  <p className="text-sm text-gray-600 mb-3">Recent changes and contributions to this workshop</p>
                  <div className="space-y-2">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                        <span className="text-lg">{entry.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700">{entry.text}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{entry.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-[860px] mx-auto flex items-center justify-between">
          {isContributorView ? (
            <>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Auto-save enabled</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Save as Draft
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                  <Save className="w-4 h-4" />
                  Submit Input
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Save Draft
                </button>
                <button
                  onClick={onLaunchWorkshop}
                  className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
                >
                  Launch Workshop
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
