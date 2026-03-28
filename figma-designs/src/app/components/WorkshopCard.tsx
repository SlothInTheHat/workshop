import { Users } from 'lucide-react';

interface WorkshopCardProps {
  onViewSummary?: () => void;
}

export function WorkshopCard({ onViewSummary }: WorkshopCardProps) {
  return (
    <div>
      {/* Main Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
        <div className="space-y-5">
          {/* Workshop Header */}
          <div>
            <h2 
              className="text-2xl text-gray-900 mb-0"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
            >
              Oncology Intake Redesign
            </h2>
          </div>

          {/* Details */}
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
                Clinical Ops
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
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-[#D1FAE5] text-[#065F46]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                Live
              </span>
            </div>

            <div className="flex items-center">
              <span 
                className="text-[12px] text-gray-500 min-w-[110px]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                Participants
              </span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span 
                  className="text-[12px] text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  12
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-5" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              className="px-4 py-2 bg-[#6B9695] hover:bg-[#5D8685] text-white rounded-md transition-colors text-[13px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              Enter Workshop
            </button>
            <button
              onClick={onViewSummary}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-[13px]"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              View Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}