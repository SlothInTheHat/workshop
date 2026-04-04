import { useState } from 'react';
import { Sparkles, CheckCircle2, Circle, X } from 'lucide-react';

interface WorkshopSetupProps {
  onStartWorkshop: () => void;
  onCancel: () => void;
}

export function WorkshopSetup({ onStartWorkshop, onCancel }: WorkshopSetupProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('Oncology');
  const [selectedObjective, setSelectedObjective] = useState<string>('improve-intake');
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [sensitivityLevel, setSensitivityLevel] = useState<string>('internal');
  const [stakeholderRoles, setStakeholderRoles] = useState<string[]>([]);
  const [showPrepopulation, setShowPrepopulation] = useState<boolean>(true);
  const [showKickoffPreview, setShowKickoffPreview] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const domains = ['Oncology', 'Cardiology', 'Radiology', 'Other'];

  const toggleStakeholderRole = (role: string) => {
    setStakeholderRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getObjectiveLabel = () => {
    const objectives: Record<string, string> = {
      'improve-intake': 'Improve patient intake',
      'reduce-burden': 'Reduce administrative burden',
      'diagnosis-support': 'Improve diagnosis support',
      'care-coordination': 'Optimize care coordination',
    };
    return objectives[selectedObjective] || '';
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 
          className="text-2xl text-gray-900 mb-2"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
        >
          Create Workshop
        </h1>
        <p 
          className="text-[13px] text-gray-500"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          Provide baseline clinical context before starting the workshop.
        </p>
      </div>

      {/* Main Setup Card */}
      <div 
        className="bg-white rounded-lg border border-gray-200 p-8"
        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
      >
        {/* Prepopulation Banner */}
        {showPrepopulation && (
          <div className="mb-6 p-4 bg-[#E6F4F4] border border-[#6B9695]/30 rounded-lg flex items-start justify-between">
            <div className="flex-1">
              <p 
                className="text-[13px] text-gray-900 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Previous Oncology workshop identified 4 finalized themes. Would you like to reference them?
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-md transition-colors text-[12px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Import Themes
                </button>
                <button
                  onClick={() => setShowPrepopulation(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[12px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Start Fresh
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPrepopulation(false)}
              className="ml-4 p-1 hover:bg-white/50 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Step Progress Indicator */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-8">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <div>
                <p 
                  className="text-[11px] text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Step 1
                </p>
                <p 
                  className="text-[13px] text-[#10B981]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Context
                </p>
              </div>
            </div>

            <div className="h-[1px] w-12 bg-gray-200" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-300" />
              <div>
                <p 
                  className="text-[11px] text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Step 2
                </p>
                <p 
                  className="text-[13px] text-gray-400"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Participants
                </p>
              </div>
            </div>

            <div className="h-[1px] w-12 bg-gray-200" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-300" />
              <div>
                <p 
                  className="text-[11px] text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Step 3
                </p>
                <p 
                  className="text-[13px] text-gray-400"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Review & Generate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-8">
          {/* Left Column - Form */}
          <div className="flex-1 space-y-7">
            {/* Clinical Domain */}
            <div>
              <label 
                className="block text-[13px] text-gray-900 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Clinical Domain
              </label>
              <div className="inline-flex bg-[#F5F3F0] rounded-md p-1 gap-1">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`px-4 py-2 rounded text-[13px] transition-all ${
                      selectedDomain === domain
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Objective */}
            <div>
              <label 
                className="block text-[13px] text-gray-900 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Primary Objective
              </label>
              <div className="space-y-2.5">
                {[
                  { value: 'improve-intake', label: 'Improve patient intake' },
                  { value: 'reduce-burden', label: 'Reduce administrative burden' },
                  { value: 'diagnosis-support', label: 'Improve diagnosis support' },
                  { value: 'care-coordination', label: 'Optimize care coordination' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="objective"
                      value={option.value}
                      checked={selectedObjective === option.value}
                      onChange={(e) => setSelectedObjective(e.target.value)}
                      className="w-4 h-4 text-[#6B9695] border-gray-300 focus:ring-[#6B9695] focus:ring-offset-0 focus:ring-2"
                    />
                    <span 
                      className="text-[13px] text-gray-700"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Current Workflow Description */}
            <div>
              <label 
                className="block text-[13px] text-gray-900 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Current Workflow Description
              </label>
              <textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Briefly describe the current clinical or operational workflow."
                rows={5}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent resize-none"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              />
            </div>

            {/* Data Sensitivity Level */}
            <div>
              <label 
                className="block text-[13px] text-gray-900 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Data Sensitivity Level
              </label>
              <div className="space-y-2.5">
                {[
                  { value: 'internal', label: 'Internal' },
                  { value: 'phi', label: 'Contains PHI' },
                  { value: 'deidentified', label: 'De-identified' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sensitivity"
                      value={option.value}
                      checked={sensitivityLevel === option.value}
                      onChange={(e) => setSensitivityLevel(e.target.value)}
                      className="w-4 h-4 text-[#6B9695] border-gray-300 focus:ring-[#6B9695] focus:ring-offset-0 focus:ring-2"
                    />
                    <span 
                      className="text-[13px] text-gray-700"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stakeholder Roles Involved */}
            <div>
              <label 
                className="block text-[13px] text-gray-900 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Stakeholder Roles Involved{' '}
                <span 
                  className="text-[12px] text-gray-400"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  (Optional)
                </span>
              </label>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Clinical Lead', 'Ops Manager', 'IT', 'Admin', 'Other'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleStakeholderRole(role)}
                    className={`px-3 py-1.5 rounded-md text-[12px] transition-all border ${
                      stakeholderRoles.includes(role)
                        ? 'bg-[#6B9695] text-white border-[#6B9695]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - AI Assistant Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-lg p-5 sticky top-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#6B9695]" />
                <h3 
                  className="text-[14px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  AI Setup Assistant
                </h3>
              </div>

              {/* Smart Suggestions */}
              <div className="mb-5">
                <h4 
                  className="text-[11px] text-gray-500 uppercase tracking-wide mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Smart Suggestions
                </h4>
                <p 
                  className="text-[12px] text-gray-700 mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Based on {selectedDomain} workshops, common focus areas include:
                </p>
                <ul className="space-y-1">
                  <li 
                    className="text-[12px] text-gray-700 flex items-start gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    <span className="text-[#6B9695] mt-0.5">•</span>
                    <span>Intake duplication</span>
                  </li>
                  <li 
                    className="text-[12px] text-gray-700 flex items-start gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    <span className="text-[#6B9695] mt-0.5">•</span>
                    <span>EHR sync gaps</span>
                  </li>
                  <li 
                    className="text-[12px] text-gray-700 flex items-start gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    <span className="text-[#6B9695] mt-0.5">•</span>
                    <span>Prior authorization delays</span>
                  </li>
                </ul>
              </div>

              {/* Context Reflection */}
              <div className="mb-5">
                <h4 
                  className="text-[11px] text-gray-500 uppercase tracking-wide mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Context Reflection
                </h4>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <span 
                      className="text-[11px] text-gray-500 min-w-[100px]"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      Selected Domain:
                    </span>
                    <span 
                      className="text-[11px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      {selectedDomain}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span 
                      className="text-[11px] text-gray-500 min-w-[100px]"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      Primary Objective:
                    </span>
                    <span 
                      className="text-[11px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      {getObjectiveLabel()}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/60 rounded-md border border-[#6B9695]/20">
                  <p 
                    className="text-[11px] text-gray-500 uppercase tracking-wide mb-1"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    AI Interpretation:
                  </p>
                  <p 
                    className="text-[12px] text-gray-700 italic"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    "This workshop will likely focus on intake bottlenecks and administrative inefficiencies."
                  </p>
                </div>
              </div>

              {/* Opportunity Suggestions */}
              <div>
                <h4 
                  className="text-[11px] text-gray-500 uppercase tracking-wide mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Opportunity Suggestions
                </h4>
                <p 
                  className="text-[12px] text-gray-700 mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Suggested opportunity clusters:
                </p>
                <ul className="space-y-1">
                  <li 
                    className="text-[12px] text-gray-700 flex items-start gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    <span className="text-[#6B9695] mt-0.5">•</span>
                    <span>Automated intake validation</span>
                  </li>
                  <li 
                    className="text-[12px] text-gray-700 flex items-start gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    <span className="text-[#6B9695] mt-0.5">•</span>
                    <span>Cross-system data sync</span>
                  </li>
                  <li 
                    className="text-[12px] text-gray-700 flex items-start gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    <span className="text-[#6B9695] mt-0.5">•</span>
                    <span>Workflow standardization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* AI Kickoff Preview Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-[14px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              AI Kickoff Preview
            </h3>
            {!showKickoffPreview && (
              <button
                onClick={() => setShowKickoffPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#6B9695] text-[#6B9695] hover:bg-[#F0F9F9] rounded-md transition-colors text-[13px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                <Sparkles className="w-4 h-4" />
                Generate Kickoff Summary
              </button>
            )}
          </div>

          {showKickoffPreview && (
            <div className="bg-[#F0F9F9] border border-[#6B9695]/30 rounded-lg p-5">
              <p 
                className="text-[13px] text-gray-700 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Based on your inputs, this workshop will explore:
              </p>
              <ul className="space-y-2 mb-4">
                <li 
                  className="text-[13px] text-gray-900 flex items-start gap-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <span className="text-[#6B9695] mt-0.5">•</span>
                  <span>Intake workflow inefficiencies</span>
                </li>
                <li 
                  className="text-[13px] text-gray-900 flex items-start gap-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <span className="text-[#6B9695] mt-0.5">•</span>
                  <span>Administrative burden reduction</span>
                </li>
                <li 
                  className="text-[13px] text-gray-900 flex items-start gap-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <span className="text-[#6B9695] mt-0.5">•</span>
                  <span>System integration gaps</span>
                </li>
              </ul>
              <p 
                className="text-[12px] text-gray-600 mb-4 italic"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                The AI Analyst will assist with clustering and MVBC drafting during the live session.
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-white rounded-md transition-colors text-[12px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Edit Summary
                </button>
                <button
                  onClick={onStartWorkshop}
                  className="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-md transition-colors text-[12px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Approve & Continue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!showKickoffPreview && (
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onStartWorkshop}
              className="px-5 py-2.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              Start Workshop
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}