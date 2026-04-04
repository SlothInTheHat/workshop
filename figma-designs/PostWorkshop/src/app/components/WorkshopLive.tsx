import { Plus, Search, ChevronDown, ChevronRight, ChevronLeft, Sparkles, MoreHorizontal, X, Link2 } from 'lucide-react';
import { useState } from 'react';

interface WorkshopLiveProps {
  onBackToDashboard?: () => void;
  onCompleteWorkshop?: () => void;
}

interface InsightCard {
  id: string;
  title: string;
  summary: string;
  impact: 'High' | 'Medium' | 'Low';
  feasibility: 'High' | 'Medium' | 'Low';
  visibility: 'Internal' | 'Restricted' | 'Cross-Silo';
  addedBy: string;
  timestamp: string;
  position: { x: number; y: number };
  clusterId?: number;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

const agendaItems: AgendaItem[] = [
  { id: '1', title: 'Current State', description: 'Map existing workflow', isActive: false },
  { id: '2', title: 'Pain Points', description: 'Identify bottlenecks & inefficiencies', isActive: true },
  { id: '3', title: 'AI Opportunities', description: 'Explore automation potential', isActive: false },
  { id: '4', title: 'Feasibility', description: 'Assess implementation readiness', isActive: false },
];

const participants = [
  { name: 'Dr. Sarah Chen', role: 'Clinical Lead', presence: 'In-room', color: 'bg-green-500' },
  { name: 'Michael Torres', role: 'Ops Director', presence: 'Remote', color: 'bg-blue-500' },
  { name: 'Jamie Liu', role: 'Data Analyst', presence: 'Remote', color: 'bg-blue-500' },
];

const workshops = [
  {
    department: 'Clinical Ops',
    items: [
      { id: '1', name: 'Oncology Intake Redesign', status: 'live', participants: 6 },
      { id: '2', name: 'Surgery Scheduling', status: 'upcoming', participants: 4 },
    ]
  },
  {
    department: 'Care Coordination',
    items: [
      { id: '3', name: 'Discharge Planning', status: 'upcoming', participants: 5 },
      { id: '4', name: 'Care Transitions', status: 'completed', participants: 8 },
    ]
  },
];

const insightCards: InsightCard[] = [
  {
    id: '1',
    title: 'Intake form duplication',
    summary: 'Multiple manual re-entry points across EHR systems',
    impact: 'High',
    feasibility: 'Medium',
    visibility: 'Internal',
    addedBy: 'Clinical Lead',
    timestamp: '2m ago',
    position: { x: 40, y: 40 },
    clusterId: 1,
  },
  {
    id: '2',
    title: 'EHR data sync delays',
    summary: 'Patient data not syncing in real-time between systems',
    impact: 'High',
    feasibility: 'Medium',
    visibility: 'Cross-Silo',
    addedBy: 'Ops Director',
    timestamp: '5m ago',
    position: { x: 40, y: 240 },
    clusterId: 1,
  },
  {
    id: '3',
    title: 'Manual fax processing',
    summary: 'Prior auth requests require manual fax review',
    impact: 'Medium',
    feasibility: 'High',
    visibility: 'Internal',
    addedBy: 'Data Analyst',
    timestamp: '12m ago',
    position: { x: 340, y: 40 },
    clusterId: 2,
  },
  {
    id: '4',
    title: 'Insurance verification lag',
    summary: 'Manual insurance checks delay intake by 24-48 hours',
    impact: 'Medium',
    feasibility: 'High',
    visibility: 'Internal',
    addedBy: 'Clinical Lead',
    timestamp: '15m ago',
    position: { x: 340, y: 240 },
    clusterId: 2,
  },
];

const getImpactColor = (level: string) => {
  switch (level) {
    case 'High': return 'bg-red-50 text-red-700 border-red-200';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low': return 'bg-gray-50 text-gray-600 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getFeasibilityColor = (level: string) => {
  switch (level) {
    case 'High': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Low': return 'bg-gray-50 text-gray-600 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getVisibilityColor = (visibility: string) => {
  switch (visibility) {
    case 'Internal': return 'bg-gray-50 text-gray-600 border-gray-200';
    case 'Restricted': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Cross-Silo': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'live': return 'bg-[#D1FAE5] text-[#065F46]';
    case 'upcoming': return 'bg-blue-50 text-blue-700';
    case 'completed': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export function WorkshopLive({ onBackToDashboard, onCompleteWorkshop }: WorkshopLiveProps) {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isAiCollapsed, setIsAiCollapsed] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(['Clinical Ops', 'Care Coordination']);
  const [expandedAgenda, setExpandedAgenda] = useState(true);
  const [aiInput, setAiInput] = useState('');

  const toggleDepartment = (dept: string) => {
    setExpandedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFAF9]">
      {/* Main Layout - No Top Bar */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Workshop Navigation (Collapsible) */}
        <div 
          className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ${
            isNavCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {isNavCollapsed ? (
            // Collapsed View - Icon Strip
            <div className="h-full flex flex-col items-center py-4 gap-4">
              <button
                onClick={() => setIsNavCollapsed(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Expand workshops"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1" />
            </div>
          ) : (
            // Expanded View - Full Navigation
            <div className="h-full flex flex-col">
              {/* Header with Collapse Toggle */}
              <div className="p-4 flex items-center justify-between border-b border-gray-200">
                <h3 
                  className="text-[13px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Workshops
                </h3>
                <button
                  onClick={() => setIsNavCollapsed(true)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Collapse panel"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* New Workshop Button */}
              <div className="p-4 border-b border-gray-200">
                <button
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <Plus className="w-4 h-4" />
                  New Workshop
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workshops..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              </div>

              {/* Workshop List by Department */}
              <div className="flex-1 overflow-y-auto">
                {workshops.map((dept) => (
                  <div key={dept.department}>
                    {/* Department Header */}
                    <button
                      onClick={() => toggleDepartment(dept.department)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span 
                        className="text-[12px] text-gray-700"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        {dept.department}
                      </span>
                      {expandedDepartments.includes(dept.department) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>

                    {/* Workshop Items */}
                    {expandedDepartments.includes(dept.department) && (
                      <div className="pb-2">
                        {dept.items.map((workshop) => (
                          <div
                            key={workshop.id}
                            className={`mx-2 mb-1 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                              workshop.status === 'live' 
                                ? 'bg-[#F0F9F9] border border-[#6B9695]/20' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p 
                                className={`text-[13px] flex-1 ${
                                  workshop.status === 'live' ? 'text-gray-900' : 'text-gray-700'
                                }`}
                                style={{ fontFamily: 'Inter, sans-serif', fontWeight: workshop.status === 'live' ? 500 : 400 }}
                              >
                                {workshop.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] ${getStatusColor(workshop.status)}`}
                                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                              >
                                {workshop.status === 'live' && (
                                  <span className="w-1 h-1 bg-[#10B981] rounded-full mr-1" />
                                )}
                                {workshop.status}
                              </span>
                              <span 
                                className="text-[10px] text-gray-500"
                                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                              >
                                {workshop.participants} participants
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Exit Workshop */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={onBackToDashboard}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <X className="w-4 h-4" />
                  Exit Workshop Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PERSISTENT WORKSHOP CONTEXT PANEL */}
        <div className="w-72 flex-shrink-0 bg-[#FAFAF9] border-r border-gray-200 flex flex-col">
          {/* Workshop Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <h2 
              className="text-[15px] text-gray-900 mb-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Oncology Intake Redesign
            </h2>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#D1FAE5] text-[#065F46]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
              Live
            </span>
          </div>

          {/* Scrollable Context Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Agenda Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setExpandedAgenda(!expandedAgenda)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-t-xl transition-colors"
              >
                <span 
                  className="text-[13px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Agenda
                </span>
                {expandedAgenda ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              {expandedAgenda && (
                <div className="px-2 pb-3 space-y-1">
                  {agendaItems.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                        item.isActive ? 'bg-[#F0F9F9]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                        item.isActive ? 'bg-[#10B981] shadow-sm shadow-[#10B981]/50 animate-pulse' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <p 
                          className={`text-[13px] ${item.isActive ? 'text-gray-900' : 'text-gray-700'}`}
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: item.isActive ? 500 : 400 }}
                        >
                          {item.title}
                        </p>
                        <p 
                          className="text-[11px] text-gray-500 mt-0.5"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Participants Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 
                  className="text-[13px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Participants
                </h3>
              </div>
              <div className="p-2 space-y-1">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full ${participant.color}`} />
                    <div className="flex-1">
                      <p 
                        className="text-[13px] text-gray-900"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        {participant.name}
                      </p>
                      <p 
                        className="text-[11px] text-gray-500"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        {participant.role} • {participant.presence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Workshop Button */}
          <div className="p-4 bg-white border-t border-gray-200 flex justify-center">
            <button
              onClick={onCompleteWorkshop}
              className="px-6 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              Complete Workshop
            </button>
          </div>
        </div>

        {/* CENTER - Canvas Whiteboard */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas Background with Grid Pattern */}
          <div 
            className="absolute inset-0 bg-[#FAFAF9]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          >
            {/* Add Insight Button */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => setIsAiCollapsed(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg shadow-sm transition-colors text-[13px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                <Plus className="w-4 h-4" />
                Add Insight
              </button>
            </div>

            {/* Floating Insight Cards */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="grid grid-cols-2 gap-6 w-max">
                {insightCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 w-80 shadow-lg hover:shadow-xl transition-all cursor-move group"
                    style={{
                      boxShadow: card.clusterId === 1 
                        ? '0 4px 20px rgba(107, 150, 149, 0.12), 0 0 0 2px rgba(107, 150, 149, 0.08)' 
                        : '0 4px 16px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 
                        className="text-[14px] text-gray-900 flex-1 leading-tight"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        {card.title}
                      </h4>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    
                    <p 
                      className="text-[13px] text-gray-600 mb-4 leading-relaxed"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      {card.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] border ${getImpactColor(card.impact)}`}
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        Impact: {card.impact}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] border ${getFeasibilityColor(card.feasibility)}`}
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        Feasibility: {card.feasibility}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] border ${getVisibilityColor(card.visibility)}`}
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        {card.visibility}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-3 border-t border-gray-100">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        {card.addedBy}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        {card.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - AI Analyst (Collapsible) */}
        <div 
          className={`bg-white border-l border-gray-200 flex-shrink-0 transition-all duration-300 ${
            isAiCollapsed ? 'w-16' : 'w-96'
          }`}
        >
          {isAiCollapsed ? (
            // Collapsed View - Vertical AI Icon
            <div className="h-full flex flex-col items-center py-4 gap-4">
              <button
                onClick={() => setIsAiCollapsed(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Open AI Analyst"
              >
                <Sparkles className="w-5 h-5 text-[#6B9695]" />
              </button>
              <div 
                className="text-[11px] text-gray-500 [writing-mode:vertical-lr] rotate-180"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                AI ANALYST
              </div>
            </div>
          ) : (
            // Expanded View - Full AI Panel
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#6B9695]" />
                    <h3 
                      className="text-[14px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      AI Analyst
                    </h3>
                  </div>
                  <p 
                    className="text-[11px] text-gray-500"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    Workshop Mode
                  </p>
                </div>
                <button
                  onClick={() => setIsAiCollapsed(true)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Collapse panel"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <p 
                      className="text-[13px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      We're seeing duplicate intake entries between Epic and the referral system.
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-[#F0F9F9] border border-[#6B9695]/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p 
                      className="text-[13px] text-gray-900 mb-2"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      Would you classify this as operational inefficiency or system integration gap?
                    </p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#F5F3F0] rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <p 
                      className="text-[13px] text-gray-900"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                    >
                      System integration gap
                    </p>
                  </div>
                </div>

                {/* AI Structured Preview */}
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-[#6B9695] rounded-xl px-4 py-3 w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-[#6B9695]" />
                      <span 
                        className="text-[11px] text-[#6B9695]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                      >
                        STRUCTURED PREVIEW
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <p 
                          className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          Title
                        </p>
                        <p 
                          className="text-[13px] text-gray-900"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          Intake Form Duplication
                        </p>
                      </div>
                      
                      <div>
                        <p 
                          className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                        >
                          Summary
                        </p>
                        <p 
                          className="text-[12px] text-gray-700"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                        >
                          Manual re-entry across EHR systems
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <div>
                          <p 
                            className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                          >
                            Impact
                          </p>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border bg-red-50 text-red-700 border-red-200"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            High
                          </span>
                        </div>
                        <div>
                          <p 
                            className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                          >
                            Feasibility
                          </p>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border bg-blue-50 text-blue-700 border-blue-200"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            Medium
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p 
                          className="text-[11px] text-gray-600"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        >
                          Similarity: <span className="text-[#6B9695] font-semibold">87%</span> to "EHR Data Sync Delays"
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[12px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        Create Insight Card
                      </button>
                      <button
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[12px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        Refine
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe an insight..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <button
                    className="px-4 py-2 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px]"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM INSIGHTS BAR - Persistent */}
      <div className="h-44 bg-white border-t-2 border-gray-200 flex-shrink-0 overflow-hidden">
        <div className="h-full px-6 py-5 flex flex-col">
          <h3 
            className="text-[15px] text-gray-900 mb-3 text-center"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
          >
            AI Insights
          </h3>
          <div className="flex-1 flex gap-4 justify-center items-center">
          {/* Suggested Theme - First */}
          <div className="flex-shrink-0 w-64">
            <div className="bg-[#E6F4F4] border border-[#6B9695]/30 rounded-xl p-3 h-full">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 bg-[#6B9695] rounded-full" />
                <span 
                  className="text-[10px] text-[#6B9695] uppercase tracking-wide"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Suggested Theme
                </span>
              </div>
              <h4 
                className="text-[13px] text-gray-900 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                Intake Workflow Optimization
              </h4>
              <p 
                className="text-[11px] text-gray-600"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                3 insights clustered
              </p>
            </div>
          </div>

          {/* Insight Similarity Detected - Replaces second Suggested Theme */}
          <div className="flex-shrink-0 w-72">
            <div className="bg-[#E6F4F4] border border-[#6B9695]/30 rounded-xl p-3 h-full">
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 className="w-3 h-3 text-[#6B9695]" />
                <span 
                  className="text-[10px] text-[#6B9695] uppercase tracking-wide"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Insight Similarity Detected
                </span>
              </div>
              <p 
                className="text-[13px] text-gray-900 mb-1 leading-snug"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                <span className="text-[#6B9695]">87%</span> similar
              </p>
              <p 
                className="text-[11px] text-gray-600"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                "Intake Form Duplication" & "EHR Data Sync"
              </p>
            </div>
          </div>

          {/* Sensitive Content Alert */}
          <div className="flex-shrink-0 w-64">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 h-full">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span 
                  className="text-[10px] text-amber-700 uppercase tracking-wide"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Sensitive Content Alert
                </span>
              </div>
              <h4 
                className="text-[13px] text-gray-900 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                Possible PHI detected
              </h4>
              <p 
                className="text-[11px] text-gray-600"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                In Insight #3
              </p>
            </div>
          </div>

          {/* Cross-Workshop Signal */}
          <div className="flex-shrink-0 w-64">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 h-full">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                <span 
                  className="text-[10px] text-purple-700 uppercase tracking-wide"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Cross-Workshop Signal
                </span>
              </div>
              <h4 
                className="text-[13px] text-gray-900 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                Similar theme in Cardiology
              </h4>
              <p 
                className="text-[11px] text-purple-700"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                "Manual Intake Bottlenecks"
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}