import { Plus, Search, Filter } from 'lucide-react';
import { StatsStrip } from './StatsStrip';
import { WorkshopCard } from './WorkshopCard';

interface WorkshopDashboardProps {
  onCreateWorkshop?: () => void;
  onOpenWorkshop?: () => void;
}

export function WorkshopDashboard({ onCreateWorkshop, onOpenWorkshop }: WorkshopDashboardProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Stats Strip */}
      <StatsStrip />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="text-3xl text-gray-900 mb-2"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              >
                Workshop Mode
              </h1>
              <p 
                className="text-[14px] text-gray-600"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Memorial Health System
              </p>
            </div>
            <button
              onClick={onCreateWorkshop}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#6B9695] text-white hover:bg-[#5A8584] rounded-lg transition-colors text-[14px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <Plus className="w-4 h-4" />
              New Workshop
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search workshops..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-[14px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Workshop Sections */}
        <div className="space-y-8">
          {/* Clinical Ops Section */}
          <div>
            <h2 
              className="text-[13px] text-gray-500 uppercase tracking-wide mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Clinical Ops
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div onClick={onOpenWorkshop} className="cursor-pointer">
                <WorkshopCard />
              </div>
            </div>
          </div>

          {/* Care Coordination Section */}
          <div>
            <h2 
              className="text-[13px] text-gray-500 uppercase tracking-wide mb-4"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              Care Coordination
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-5">
                  <div>
                    <h3 
                      className="text-2xl text-gray-900 mb-0"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                    >
                      Discharge Planning Optimization
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center">
                      <span 
                        className="text-[12px] text-gray-500 min-w-[110px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Business Unit
                      </span>
                      <span 
                        className="text-[12px] text-gray-700"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Care Coordination
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span 
                        className="text-[12px] text-gray-500 min-w-[110px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Status
                      </span>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      >
                        Upcoming
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span 
                        className="text-[12px] text-gray-500 min-w-[110px]"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Scheduled
                      </span>
                      <span 
                        className="text-[12px] text-gray-700"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        Feb 28, 2026 • 2:00 PM
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5" />

                  <div className="flex items-center gap-2.5">
                    <button
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px]"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
