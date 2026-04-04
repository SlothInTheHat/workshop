import { Plus, Search, Users, Lightbulb, Activity } from 'lucide-react';

interface WorkshopDashboardProps {
  onCreateWorkshop?: () => void;
  onOpenWorkshop?: () => void;
}

export function WorkshopDashboard({ onCreateWorkshop, onOpenWorkshop }: WorkshopDashboardProps) {
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#FAFAF9]">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#F5F3F0] border-r border-gray-200 flex flex-col">
        {/* New Workshop Button */}
        <div className="p-4">
          <button
            onClick={onCreateWorkshop}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            New Workshop
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workshops..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Workshop List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
          {/* Clinical Ops Section */}
          <div>
            <h3 
              className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 px-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Clinical Ops
            </h3>
            <div className="space-y-1">
              {/* Active Workshop */}
              <button 
                onClick={onOpenWorkshop}
                className="w-full text-left px-3 py-2.5 bg-white rounded-lg border-l-2 border-[#6B9695] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 flex-shrink-0" />
                  <h4 
                    className="text-[13px] text-gray-900 leading-tight"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Oncology Intake Redesign
                  </h4>
                </div>
                <div className="flex items-center gap-2 ml-3.5">
                  <span 
                    className="text-[11px] text-[#10B981]"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Live
                  </span>
                  <span className="text-gray-300">•</span>
                  <span 
                    className="text-[11px] text-gray-500"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    4 themes finalized
                  </span>
                </div>
              </button>

              {/* Upcoming Workshop */}
              <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/50 transition-colors">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <h4 
                    className="text-[13px] text-gray-900 leading-tight"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Prior Auth Optimization
                  </h4>
                </div>
                <div className="flex items-center gap-2 ml-3.5">
                  <span 
                    className="text-[11px] text-blue-600"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Upcoming
                  </span>
                  <span className="text-gray-300">•</span>
                  <span 
                    className="text-[11px] text-gray-500"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    6
                  </span>
                </div>
                <div className="ml-3.5 mt-1">
                  <span 
                    className="text-[11px] text-red-600"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    Setup required
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Care Coordination Section */}
          <div>
            <h3 
              className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 px-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Care Coordination
            </h3>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/50 transition-colors">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <h4 
                    className="text-[13px] text-gray-900 leading-tight"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    Care Coordination AI
                  </h4>
                </div>
                <div className="flex items-center gap-2 ml-3.5">
                  <span 
                    className="text-[11px] text-gray-600"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Completed
                  </span>
                  <span className="text-gray-300">•</span>
                  <span 
                    className="text-[11px] text-gray-500"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    7
                  </span>
                </div>
                <div className="ml-3.5 mt-1">
                  <span 
                    className="text-[11px] text-gray-500"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    Summary available
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="space-y-0.5 mb-8">
              <p 
                className="text-[12px] text-gray-500"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Organization: Memorial Health System
              </p>
              <p 
                className="text-[12px] text-gray-500"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Industry: Healthcare Provider
              </p>
            </div>
            <h1 
              className="text-3xl text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
            >
              Workshop Mode
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <p 
                className="text-[12px] text-gray-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Active Workshops
              </p>
              <p 
                className="text-3xl text-gray-900"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              >
                2
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <p 
                className="text-[12px] text-gray-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Total Participants
              </p>
              <p 
                className="text-3xl text-gray-900"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              >
                27
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <Lightbulb className="w-5 h-5 text-gray-400" />
              </div>
              <p 
                className="text-[12px] text-gray-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Insights Generated
              </p>
              <p 
                className="text-3xl text-gray-900"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              >
                64
              </p>
            </div>
          </div>

          {/* Selected Workshop Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 
              className="text-2xl text-gray-900 mb-6"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
            >
              Oncology Intake Redesign
            </h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
              <div className="flex items-center">
                <span 
                  className="text-[12px] text-gray-500 min-w-[120px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Business Unit
                </span>
                <span 
                  className="text-[13px] text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Clinical Ops
                </span>
              </div>

              <div className="flex items-center">
                <span 
                  className="text-[12px] text-gray-500 min-w-[120px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Status
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-green-50 text-green-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  Live
                </span>
              </div>

              <div className="flex items-center">
                <span 
                  className="text-[12px] text-gray-500 min-w-[120px]"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  Participants
                </span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span 
                    className="text-[13px] text-gray-900"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    12
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={onOpenWorkshop}
                className="px-5 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[13px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Enter Workshop
              </button>
              <button
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[13px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                View Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}