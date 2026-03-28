import { FileDown, Share2, ThumbsUp, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface WorkshopSummaryProps {
  onBackToDashboard?: () => void;
}

type Tab = 'round1' | 'round2' | 'executive';

interface Idea {
  id: string;
  title: string;
  contributor: string;
  description: string;
  votes?: number;
  rank?: number;
  whyItMatters?: string[];
  value?: number;
  viability?: number;
  difficulty?: 'Low' | 'Medium' | 'High';
  suggestedAgent?: string;
}

const ideas: Idea[] = [
  {
    id: '1',
    title: 'Intake Auto-Validation',
    contributor: 'Andy',
    description: 'Automate the validation process for patient intake to reduce manual errors and improve efficiency.',
    votes: 85,
    rank: 1,
    whyItMatters: [
      'Reduces patient onboarding time by 40%, and minimizes manual data entry errors, directly supporting operational efficiency goals.',
    ],
    value: 85,
    viability: 90,
    difficulty: 'Low',
    suggestedAgent: 'Intake Processing Agent',
  },
  {
    id: '2',
    title: 'Prior Authorization Automation',
    contributor: 'Jason',
    description: 'Streamline the prior authorization process by automating the submission and tracking of requests.',
    votes: 78,
    rank: 2,
    whyItMatters: [
      'Decreases authorization turnaround time by 60%, enabling faster treatment initiation and improved patient satisfaction.',
    ],
    value: 75,
    viability: 65,
    difficulty: 'Medium',
    suggestedAgent: 'Authorization Workflow Agent',
  },
  {
    id: '3',
    title: 'EHR Data Standardization',
    contributor: 'Emily',
    description: 'Standardize the data format across the EHR system to improve data quality and interoperability.',
    votes: 72,
    rank: 3,
    whyItMatters: [
      'Enhances cross-departmental data consistency and supports better clinical decision-making through unified data.',
    ],
    value: 70,
    viability: 55,
    difficulty: 'High',
    suggestedAgent: 'Data Harmonization Agent',
  },
  {
    id: '4',
    title: 'Appointment Scheduling Optimization',
    contributor: 'Maria',
    description: 'Optimize appointment scheduling to reduce wait times and improve resource utilization.',
    votes: 68,
    rank: 4,
    whyItMatters: [
      'Improves patient satisfaction by reducing wait times by 30%.',
    ],
    value: 60,
    viability: 75,
    difficulty: 'Low',
    suggestedAgent: 'Scheduling Agent',
  },
];

const ContributorTag = ({ name }: { name: string }) => (
  <div 
    className="inline-flex items-center gap-1.5 text-gray-500"
    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px' }}
  >
    <User className="w-3.5 h-3.5" />
    <span>{name}</span>
  </div>
);

const DifficultyBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' }) => {
  const colors = {
    Low: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-red-50 text-red-700 border-red-200',
  };
  
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-md border ${colors[level]}`}
      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px' }}
    >
      {level} Difficulty
    </span>
  );
};

const StrategicPillTag = ({ label }: { label: string }) => (
  <button
    className="inline-flex items-center px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
  >
    {label}
  </button>
);

export function WorkshopSummary({ onBackToDashboard }: WorkshopSummaryProps) {
  const [activeTab, setActiveTab] = useState<Tab>('round1');
  const [showAINotes, setShowAINotes] = useState(false);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 
              className="text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '18px' }}
            >
              Workshop: Oncology Intake Redesign
            </h1>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-gray-600 bg-gray-100"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px' }}
            >
              Completed
            </span>
          </div>

          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
          >
            Back to Workshops
          </button>
        </div>

        {/* Toggle AI Notes */}
        {activeTab === 'round2' && (
          <button
            onClick={() => setShowAINotes(!showAINotes)}
            className="flex items-center gap-2 text-gray-700 mb-4"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px' }}
          >
            <span>• Toggle AI Notes</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAINotes ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('round1')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors ${
              activeTab === 'round1'
                ? 'bg-[#6B9695] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
          >
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
              activeTab === 'round1' ? 'bg-white text-[#6B9695]' : 'bg-white text-gray-600'
            }`} style={{ fontWeight: 600 }}>
              {activeTab === 'round1' ? '1' : <span className="text-green-600">✓</span>}
            </span>
            <span>Round 1 – Blind Voting</span>
          </button>
          
          <button
            onClick={() => setActiveTab('round2')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors ${
              activeTab === 'round2'
                ? 'bg-[#6B9695] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
          >
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
              activeTab === 'round2' ? 'bg-white text-[#6B9695]' : 'bg-white text-gray-600'
            }`} style={{ fontWeight: 600 }}>
              2
            </span>
            <span>Round 2 – Voting Results</span>
          </button>
          
          <button
            onClick={() => setActiveTab('executive')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors ${
              activeTab === 'executive'
                ? 'bg-[#6B9695] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
          >
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
              activeTab === 'executive' ? 'bg-white text-[#6B9695]' : 'bg-white text-gray-600'
            }`} style={{ fontWeight: 600 }}>
              3
            </span>
            <span>Executive Summary</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Round 1 - Blind Voting */}
        {activeTab === 'round1' && (
          <div className="max-w-5xl">
            {/* Progress Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-blue-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}
                >
                  Blind voting in progress
                </span>
                <span 
                  className="text-blue-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
                >
                  8/12 votes submitted
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }} />
              </div>
              <p 
                className="text-blue-700"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px' }}
              >
                Vote totals are hidden until all participants submit their rankings.
              </p>
            </div>

            <h2 
              className="text-gray-900 mb-6"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '20px' }}
            >
              Round 1 – Blind Crowd Voting
            </h2>
            
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div 
                  key={idea.id}
                  className="bg-white rounded-lg border border-gray-200 p-5"
                  style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 
                        className="text-gray-900 mb-2"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '15px' }}
                      >
                        {idea.title}
                      </h3>
                      
                      <div className="mb-3">
                        <ContributorTag name={idea.contributor} />
                      </div>
                      
                      <p 
                        className="text-gray-600"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.5' }}
                      >
                        {idea.description}
                      </p>
                    </div>
                    
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors ml-4"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Upvote</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round 2 - Voting Results */}
        {activeTab === 'round2' && (
          <div className="max-w-5xl">
            {/* Results Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p 
                className="text-purple-900 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}
              >
                Voting Results Revealed
              </p>
              <p 
                className="text-purple-700"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px' }}
              >
                All votes have been submitted. Results are now visible to all participants.
              </p>
            </div>

            <h2 
              className="text-gray-900 mb-6"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '20px' }}
            >
              Round 2 – Voting Results
            </h2>
            
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div 
                  key={idea.id}
                  className="bg-white rounded-lg border border-gray-200 p-5"
                  style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 
                        className="text-gray-900 mb-2"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '15px' }}
                      >
                        {idea.title}
                      </h3>
                      
                      <div className="mb-3">
                        <ContributorTag name={idea.contributor} />
                      </div>
                      
                      <p 
                        className="text-gray-600"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.5' }}
                      >
                        {idea.description}
                      </p>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div 
                        className="text-gray-500 mb-1"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '11px' }}
                      >
                        Crowd Score
                      </div>
                      <div 
                        className="text-gray-900"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: '1' }}
                      >
                        {idea.votes}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Summary */}
        {activeTab === 'executive' && (
          <div className="max-w-4xl space-y-8">
            {/* Header with Download Button */}
            <div className="flex items-center justify-between">
              <h2 
                className="text-gray-900"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '20px' }}
              >
                Executive Workshop Summary
              </h2>
              
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
              >
                <FileDown className="w-4 h-4" />
                <span>Download Executive Report</span>
              </button>
            </div>

            {/* Section 1 - Workshop Context */}
            <div 
              className="bg-white rounded-lg border border-gray-200 p-6"
              style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
              <h3 
                className="text-gray-900 mb-5"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px' }}
              >
                Workshop Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 
                    className="text-gray-900 mb-1"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px' }}
                  >
                    Client Strategic Priorities
                  </h4>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.6' }}
                  >
                    Optimize onboarding, patient experience optimization, clinical workflow enhancement, data interoperability improvements.
                  </p>
                </div>
                
                <div>
                  <h4 
                    className="text-gray-900 mb-1"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px' }}
                  >
                    Workshop Objectives
                  </h4>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.6' }}
                  >
                    Identify automation opportunities to streamline pre-visit patient intake and reduce administrative bottlenecks.
                  </p>
                </div>
                
                <div>
                  <h4 
                    className="text-gray-900 mb-1"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px' }}
                  >
                    Key Workflow Area Discussed
                  </h4>
                  <p 
                    className="text-gray-600"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.6' }}
                  >
                    Oncology patient intake, prior authorization workflows, EHR data management systems.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 - Top Opportunities */}
            <div>
              <h3 
                className="text-gray-900 mb-4"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px' }}
              >
                Top Opportunities Identified
              </h3>
              
              <div className="space-y-4">
                {ideas.slice(0, 3).map((idea) => (
                  <div 
                    key={idea.id}
                    className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-[#6B9695] p-5"
                    style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6B9695] text-white flex items-center justify-center"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}
                      >
                        {idea.rank}
                      </div>
                      
                      <div className="flex-1">
                        <h4 
                          className="text-gray-900 mb-2"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '15px' }}
                        >
                          {idea.title}
                        </h4>
                        
                        <div className="mb-3">
                          <ContributorTag name={idea.contributor} />
                        </div>
                        
                        <p 
                          className="text-gray-600 mb-4"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.5' }}
                        >
                          {idea.description}
                        </p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p 
                            className="text-blue-900 mb-2"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px' }}
                          >
                            Why It Matters to the Client
                          </p>
                          <ul className="space-y-1">
                            {idea.whyItMatters?.map((point, idx) => (
                              <li 
                                key={idx}
                                className="text-blue-800 flex items-start gap-2"
                                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '1.5' }}
                              >
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3 - Strategic Alignment */}
            <div 
              className="bg-white rounded-lg border border-gray-200 p-6"
              style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
              <h3 
                className="text-gray-900 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px' }}
              >
                Alignment with Client Strategic Pillars
              </h3>
              
              <p 
                className="text-gray-600 mb-4"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: '1.5' }}
              >
                The identified opportunities align with the following strategic pillars defined during pre-workshop setup:
              </p>
              
              <div className="flex flex-wrap gap-3">
                <StrategicPillTag label="Operational Efficiency" />
                <StrategicPillTag label="Patient Experience" />
                <StrategicPillTag label="Clinical Workflow Optimization" />
                <StrategicPillTag label="Data Interoperability" />
              </div>
            </div>

            {/* Section 4 - Quick Implementation */}
            <div>
              <h3 
                className="text-gray-900 mb-4"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px' }}
              >
                Fastest Opportunities Using Existing Optura Agents
              </h3>
              
              <div className="space-y-3">
                {ideas.filter(idea => idea.difficulty === 'Low' || idea.difficulty === 'Medium').map((idea) => (
                  <div 
                    key={idea.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                    style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 
                          className="text-gray-900 mb-1"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px' }}
                        >
                          {idea.title}
                        </h4>
                        <p 
                          className="text-gray-600"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px' }}
                        >
                          Suggested Agent: {idea.suggestedAgent}
                        </p>
                      </div>
                      
                      <DifficultyBadge level={idea.difficulty!} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5 - Value vs. Viability Chart */}
            <div 
              className="bg-white rounded-lg border border-gray-200 p-6"
              style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
              <h3 
                className="text-gray-900 mb-6"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px' }}
              >
                Value vs Viability Analysis
              </h3>
              
              <div className="relative w-full" style={{ height: '400px' }}>
                {/* Quadrant Background */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-gray-300 p-4">
                    <span 
                      className="text-gray-400 text-xs"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      High Value / Low Viability
                    </span>
                  </div>
                  <div className="border-b border-gray-300 p-4">
                    <span 
                      className="text-gray-700 text-xs"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      High Value / High Viability
                    </span>
                  </div>
                  <div className="border-r border-gray-300 p-4 flex items-end">
                    <span 
                      className="text-gray-400 text-xs"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      Low Value / Low Viability
                    </span>
                  </div>
                  <div className="p-4 flex items-end">
                    <span 
                      className="text-gray-400 text-xs"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      Low Value / High Viability
                    </span>
                  </div>
                </div>
                
                {/* Data points */}
                {ideas.map((idea) => {
                  const xPos = ((idea.viability || 50) / 100) * 100;
                  const yPos = 100 - ((idea.value || 50) / 100) * 100;
                  
                  return (
                    <div
                      key={idea.id}
                      className="absolute w-2.5 h-2.5 rounded-full bg-[#6B9695] hover:bg-[#5D8685] cursor-pointer transition-all hover:scale-150"
                      style={{
                        left: `${xPos}%`,
                        top: `${yPos}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      title={idea.title}
                    />
                  );
                })}
                
                {/* Axis Labels */}
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-gray-600 text-xs whitespace-nowrap"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Implementation Viability →
                </div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 -rotate-90 text-gray-600 text-xs whitespace-nowrap"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Business Value →
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
              >
                <FileDown className="w-4 h-4" />
                <span>Export Executive Summary</span>
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px' }}
              >
                <Share2 className="w-4 h-4" />
                <span>Share with Stakeholders</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}