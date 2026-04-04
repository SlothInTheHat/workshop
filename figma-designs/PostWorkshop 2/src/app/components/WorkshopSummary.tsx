import { FileDown, Share2, ChevronDown, ChevronUp, ThumbsUp, User } from 'lucide-react';
import { useState } from 'react';

interface WorkshopSummaryProps {
  onBackToDashboard?: () => void;
}

interface RankedUseCase {
  id: string;
  title: string;
  description: string;
  contributor?: string;
  crowdVoteScore: number;
  whyItMatters: string;
  viability: number; // 0-100 for chart positioning
  businessValue: number; // 0-100 for chart positioning
}

interface QuickImplementation {
  id: string;
  ideaName: string;
  suggestedAgent: string;
  difficulty: 'Low' | 'Medium' | 'High';
}

type VotingPhase = 'round1' | 'round2' | 'final';

export function WorkshopSummary({ onBackToDashboard }: WorkshopSummaryProps) {
  const [activePhase, setActivePhase] = useState<VotingPhase>('round1');
  const [showAINotes, setShowAINotes] = useState(false);

  // Mock data for ranked use cases
  const rankedUseCases: RankedUseCase[] = [
    {
      id: '1',
      title: 'Intake Auto-Validation',
      description: 'Automate the validation process for patient intake to reduce manual errors and improve efficiency.',
      contributor: 'Andy',
      crowdVoteScore: 85,
      whyItMatters: 'Reduces patient onboarding time by 40% and minimizes manual data entry errors, directly supporting operational efficiency goals.',
      viability: 78,
      businessValue: 92,
    },
    {
      id: '2',
      title: 'Prior Authorization Automation',
      description: 'Streamline the prior authorization process by automating the submission and tracking of requests.',
      contributor: 'Jason',
      crowdVoteScore: 78,
      whyItMatters: 'Decreases authorization turnaround time by 60%, enabling faster treatment initiation and improved patient satisfaction.',
      viability: 72,
      businessValue: 85,
    },
    {
      id: '3',
      title: 'EHR Data Standardization',
      description: 'Standardize the data format across the EHR system to improve data quality and interoperability.',
      contributor: 'Emily',
      crowdVoteScore: 72,
      whyItMatters: 'Enhances cross-departmental data consistency and supports better clinical decision-making through reliable data.',
      viability: 68,
      businessValue: 75,
    },
  ];

  const quickImplementations: QuickImplementation[] = [
    {
      id: '1',
      ideaName: 'Intake Auto-Validation',
      suggestedAgent: 'Intake Processing Agent',
      difficulty: 'Low',
    },
    {
      id: '2',
      ideaName: 'Prior Authorization Automation',
      suggestedAgent: 'Authorization Workflow Agent',
      difficulty: 'Medium',
    },
  ];

  const strategicPillars = [
    'Operational Efficiency',
    'Patient Experience',
    'Clinical Workflow Optimization',
    'Data Interoperability',
  ];

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto pt-8 pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 
              className="text-xl text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Workshop: Oncology Intake Redesign
            </h1>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              Completed
            </span>
          </div>

          {/* Back Button */}
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Back to Workshops
          </button>
        </div>

        {/* Toggle AI Notes Section */}
        <button
          onClick={() => setShowAINotes(!showAINotes)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors mb-4"
          style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}
        >
          <span 
            className="text-[13px] text-gray-700"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            ▸ Toggle AI Notes
          </span>
          {showAINotes ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* AI Notes Panel */}
        {showAINotes && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <div className="space-y-4">
              <div>
                <h4 
                  className="text-[12px] text-gray-900 mb-1.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Workshop Overview
                </h4>
                <p 
                  className="text-[11px] text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Oncology Intake Redesign workshop focused on streamlining patient onboarding and reducing administrative bottlenecks.
                </p>
              </div>

              <div>
                <h4 
                  className="text-[12px] text-gray-900 mb-1.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Key Bottlenecks Identified
                </h4>
                <p 
                  className="text-[11px] text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Manual validation delays, prior authorization complexity, inconsistent EHR data entry across departments.
                </p>
              </div>

              <div>
                <h4 
                  className="text-[12px] text-gray-900 mb-1.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  AI Suggested Themes
                </h4>
                <p 
                  className="text-[11px] text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Intake Workflow Optimization (4 insights), EHR Data Standardization (2 insights), Authorization Process Automation (3 insights).
                </p>
              </div>

              <div>
                <h4 
                  className="text-[12px] text-gray-900 mb-1.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Cross-Workshop Signals
                </h4>
                <p 
                  className="text-[11px] text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Similar "Manual Intake Bottlenecks" theme detected in Cardiology Workshop (Dec 2025). Suggests enterprise-wide pattern.
                </p>
              </div>

              <div>
                <h4 
                  className="text-[12px] text-gray-900 mb-1.5"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Recommended Focus Areas
                </h4>
                <p 
                  className="text-[11px] text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Prioritize automation opportunities with high impact and medium feasibility. Consider pilot with Clinical IT for intake validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Voting Phase Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6 flex gap-1" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
          {/* Round 1 Tab */}
          <button
            onClick={() => setActivePhase('round1')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
              activePhase === 'round1'
                ? 'bg-[#6B9695] text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              activePhase === 'round1'
                ? 'bg-white text-[#6B9695]'
                : 'bg-green-500 text-white'
            }`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              1
            </div>
            <span className="text-[12px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Round 1 – Blind Voting
            </span>
          </button>

          {/* Round 2 Tab */}
          <button
            onClick={() => setActivePhase('round2')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
              activePhase === 'round2'
                ? 'bg-[#6B9695] text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              activePhase === 'round2'
                ? 'bg-white text-[#6B9695]'
                : 'bg-green-500 text-white'
            }`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              2
            </div>
            <span className="text-[12px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Round 2 – Voting Results
            </span>
          </button>

          {/* Executive Summary Tab */}
          <button
            onClick={() => setActivePhase('final')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
              activePhase === 'final'
                ? 'bg-[#6B9695] text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              activePhase === 'final'
                ? 'bg-white text-[#6B9695]'
                : 'bg-gray-200 text-gray-600'
            }`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              3
            </div>
            <span className="text-[12px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Executive Summary
            </span>
          </button>
        </div>

        {/* Phase-Specific Status Banners */}
        {activePhase === 'round1' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 
                className="text-[13px] text-blue-900"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                Blind voting in progress
              </h3>
              <span 
                className="text-[12px] text-blue-700"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                8/12 votes submitted
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
            <p 
              className="text-[11px] text-blue-700 mt-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              Vote totals are hidden until all participants submit their rankings.
            </p>
          </div>
        )}

        {activePhase === 'round2' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 
              className="text-[13px] text-purple-900 mb-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Voting Results Revealed
            </h3>
            <p 
              className="text-[11px] text-purple-700"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              All votes have been submitted. Results are now visible to all participants.
            </p>
          </div>
        )}
      </div>

      {/* ROUND 1 – Blind Voting Screen */}
      {activePhase === 'round1' && (
        <div className="space-y-6 mb-8">
          <h2 
            className="text-[18px] text-gray-900"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
          >
            Round 1 – Blind Crowd Voting
          </h2>

          {/* Ideas List */}
          <div className="space-y-4">
            {rankedUseCases.map((useCase) => (
              <div
                key={useCase.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
                style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 
                      className="text-[15px] text-gray-900 mb-2"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      {useCase.title}
                    </h3>
                    
                    {/* Contributor Tag */}
                    {useCase.contributor && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6] rounded-full"
                        >
                          <User className="w-3 h-3 text-gray-600" />
                          <span 
                            className="text-[12px] text-gray-700"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            {useCase.contributor}
                          </span>
                        </div>
                      </div>
                    )}

                    <p 
                      className="text-[13px] text-gray-600"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {useCase.description}
                    </p>
                  </div>

                  <button
                    className="ml-6 flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-[#6B9695] hover:bg-[#F0F9F9] rounded-md transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4 text-gray-600" />
                    <span 
                      className="text-[13px] text-gray-700"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      Upvote
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROUND 2 – Voting Results */}
      {activePhase === 'round2' && (
        <div className="space-y-6 mb-8">
          <h2 
            className="text-[18px] text-gray-900"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
          >
            Round 2 – Voting Results
          </h2>

          {/* Ideas List with Scores */}
          <div className="space-y-4">
            {rankedUseCases.map((useCase) => (
              <div
                key={useCase.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
                style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 
                      className="text-[15px] text-gray-900 mb-2"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      {useCase.title}
                    </h3>

                    {/* Contributor Tag */}
                    {useCase.contributor && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F4F6] rounded-full"
                        >
                          <User className="w-3 h-3 text-gray-600" />
                          <span 
                            className="text-[12px] text-gray-700"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            {useCase.contributor}
                          </span>
                        </div>
                      </div>
                    )}

                    <p 
                      className="text-[13px] text-gray-600 mb-4"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {useCase.description}
                    </p>
                  </div>

                  {/* Crowd Score */}
                  <div className="ml-6 text-right">
                    <span 
                      className="text-[11px] text-gray-500 block mb-1"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      Crowd Score
                    </span>
                    <p 
                      className="text-[24px] text-[#6B9695]"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      {useCase.crowdVoteScore}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXECUTIVE SUMMARY */}
      {activePhase === 'final' && (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-[20px] text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Executive Workshop Summary
            </h2>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <FileDown className="w-4 h-4" />
              <span>Download Executive Report</span>
            </button>
          </div>

          {/* Workshop Context */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <h3 
              className="text-[16px] text-gray-900 mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Workshop Context
            </h3>
            <div className="space-y-3">
              <div>
                <span 
                  className="text-[12px] text-gray-500 block mb-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Client Strategic Priorities
                </span>
                <p 
                  className="text-[13px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Operational efficiency, patient experience optimization, clinical workflow enhancement, data interoperability improvements
                </p>
              </div>
              <div>
                <span 
                  className="text-[12px] text-gray-500 block mb-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Workshop Objectives
                </span>
                <p 
                  className="text-[13px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Identify automation opportunities to streamline oncology patient intake and reduce administrative bottlenecks
                </p>
              </div>
              <div>
                <span 
                  className="text-[12px] text-gray-500 block mb-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Key Workflow Area Discussed
                </span>
                <p 
                  className="text-[13px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Oncology patient intake, prior authorization workflows, EHR data management systems
                </p>
              </div>
            </div>
          </div>

          {/* Top Opportunities Identified */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <h3 
              className="text-[16px] text-gray-900 mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Top Opportunities Identified
            </h3>
            <div className="space-y-5">
              {rankedUseCases.map((useCase, index) => (
                <div 
                  key={useCase.id}
                  className="border-l-4 border-[#6B9695] pl-5 py-2"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full bg-[#6B9695] text-white flex items-center justify-center text-[11px] flex-shrink-0"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 
                        className="text-[15px] text-gray-900 mb-1"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        {useCase.title}
                      </h4>
                      {useCase.contributor && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#F3F4F6] rounded-full"
                          >
                            <User className="w-3 h-3 text-gray-600" />
                            <span 
                              className="text-[11px] text-gray-700"
                              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                            >
                              {useCase.contributor}
                            </span>
                          </div>
                        </div>
                      )}
                      <p 
                        className="text-[13px] text-gray-600 mb-2"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        {useCase.description}
                      </p>
                      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-2">
                        <span 
                          className="text-[11px] text-blue-900 font-medium block mb-1"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          Why It Matters to the Client
                        </span>
                        <p 
                          className="text-[12px] text-blue-800"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                        >
                          {useCase.whyItMatters}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Alignment */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <h3 
              className="text-[16px] text-gray-900 mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Alignment with Client Strategic Pillars
            </h3>
            <p 
              className="text-[13px] text-gray-600 mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              The identified opportunities align with the following strategic pillars defined during pre-workshop setup:
            </p>
            <div className="flex flex-wrap gap-2">
              {strategicPillars.map((pillar, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-2 bg-[#F0F9F9] border border-[#C7E0DF] rounded-md"
                >
                  <span 
                    className="text-[12px] text-[#4A7A79]"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    {pillar}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Implementation Opportunities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <h3 
              className="text-[16px] text-gray-900 mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Fastest Opportunities Using Existing Optura Agents
            </h3>
            <div className="space-y-3">
              {quickImplementations.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 
                        className="text-[14px] text-gray-900 mb-1"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        {item.ideaName}
                      </h4>
                      <p 
                        className="text-[12px] text-gray-600"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Suggested Agent: <span className="text-[#6B9695] font-medium">{item.suggestedAgent}</span>
                      </p>
                    </div>
                    <div className="ml-4">
                      <span 
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] ${
                          item.difficulty === 'Low'
                            ? 'bg-green-100 text-green-700'
                            : item.difficulty === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        {item.difficulty} Difficulty
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Value vs Viability Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <h3 
              className="text-[16px] text-gray-900 mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Value vs Viability Analysis
            </h3>
            <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-8" style={{ height: '400px' }}>
              {/* Chart Quadrants */}
              <div className="absolute inset-8">
                {/* Vertical center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
                {/* Horizontal center line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>
                
                {/* Quadrant Labels */}
                <div className="absolute top-2 left-2 text-[10px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  High Value / Low Viability
                </div>
                <div className="absolute top-2 right-2 text-[10px] text-gray-500 text-right" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  High Value / High Viability
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  Low Value / Low Viability
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 text-right" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  Low Value / High Viability
                </div>

                {/* Data Points */}
                {rankedUseCases.map((useCase) => {
                  const xPos = `${useCase.viability}%`;
                  const yPos = `${100 - useCase.businessValue}%`; // Invert Y axis
                  
                  return (
                    <div
                      key={useCase.id}
                      className="absolute group"
                      style={{ 
                        left: xPos, 
                        top: yPos,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-[#6B9695] border-2 border-white shadow-md"></div>
                      <div className="absolute left-4 top-0 bg-gray-900 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        {useCase.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Axis Labels */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-[11px] text-gray-600" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Implementation Viability →
              </div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 -rotate-90 text-[11px] text-gray-600 whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Business Value →
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px]"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
        >
          <FileDown className="w-4 h-4" />
          <span>Export Executive Summary</span>
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px]"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
        >
          <Share2 className="w-4 h-4" />
          <span>Share with Stakeholders</span>
        </button>
      </div>
    </div>
  );
}
