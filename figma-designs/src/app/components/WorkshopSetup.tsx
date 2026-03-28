import { useState } from 'react';

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

  const domains = ['Oncology', 'Cardiology', 'Radiology', 'Other'];

  const toggleStakeholderRole = (role: string) => {
    setStakeholderRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
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
        className="bg-white rounded-lg border border-gray-200 p-8 max-w-[720px]"
        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
      >
        {/* Progress Indicator */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <p 
            className="text-[11px] text-gray-500 uppercase tracking-wider"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Step 1 of 3 – Context Setup
          </p>
        </div>

        <div className="space-y-7">
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

        {/* Action Buttons */}
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
      </div>
    </div>
  );
}