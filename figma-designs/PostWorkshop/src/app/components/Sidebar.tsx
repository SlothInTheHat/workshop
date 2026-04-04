import { Plus, Search, Users } from 'lucide-react';

interface Workshop {
  id: string;
  title: string;
  status: 'Live' | 'Upcoming' | 'Completed';
  participants: number;
  metadata: string;
  isActive?: boolean;
  businessUnit: string;
}

const workshops: Workshop[] = [
  {
    id: '1',
    title: 'Oncology Intake Redesign',
    status: 'Live',
    participants: 12,
    metadata: '4 themes finalized',
    isActive: true,
    businessUnit: 'CLINICAL OPS',
  },
  {
    id: '2',
    title: 'Prior Auth Optimization',
    status: 'Upcoming',
    participants: 8,
    metadata: 'Setup required',
    businessUnit: 'CLINICAL OPS',
  },
  {
    id: '3',
    title: 'Care Coordination AI',
    status: 'Completed',
    participants: 7,
    metadata: 'Summary available',
    businessUnit: 'CARE COORDINATION',
  },
];

const getStatusColor = (status: Workshop['status']) => {
  switch (status) {
    case 'Live':
      return 'bg-[#10B981]';
    case 'Upcoming':
      return 'bg-[#3B82F6]';
    case 'Completed':
      return 'bg-[#9CA3AF]';
  }
};

const getStatusBadgeStyle = (status: Workshop['status']) => {
  switch (status) {
    case 'Live':
      return 'bg-[#D1FAE5] text-[#065F46]';
    case 'Upcoming':
      return 'bg-blue-50 text-blue-700';
    case 'Completed':
      return 'bg-gray-100 text-gray-600';
  }
};

interface SidebarProps {
  onNewWorkshop?: () => void;
}

export function Sidebar({ onNewWorkshop }: SidebarProps) {
  // Group workshops by business unit
  const businessUnits = Array.from(new Set(workshops.map(w => w.businessUnit)));

  return (
    <div className="w-64 bg-[#fafafa] border-r border-[#E5E2DD] h-full px-4 py-4">
      {/* New Workshop Button */}
      <button 
        onClick={onNewWorkshop}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-[#D1CCC3] text-gray-900 rounded-md hover:bg-[#F5F3F0] transition-colors mb-4"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500 }}
      >
        <Plus className="w-4 h-4" />
        <span>New Workshop</span>
      </button>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search workshops..."
          className="w-full pl-9 pr-3 py-2 bg-[#F5F3F0] border border-[#E5E2DD] rounded-md text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#6B9695] focus:border-[#6B9695] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}
        />
      </div>

      {/* Workshops Section - Grouped by Business Unit */}
      <div className="space-y-5">
        {businessUnits.map((unit) => {
          const unitWorkshops = workshops.filter(w => w.businessUnit === unit);
          return (
            <div key={unit}>
              <h3 
                className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 px-2"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                {unit}
              </h3>
              <div className="space-y-0.5">
                {unitWorkshops.map((workshop) => (
                  <div
                    key={workshop.id}
                    className={`px-2.5 py-2.5 rounded-md cursor-pointer transition-colors ${
                      workshop.isActive
                        ? 'bg-[#F5F3F0]'
                        : 'hover:bg-[#F5F3F0]'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(workshop.status)}`} />
                      <div className="flex-1">
                        <h4 
                          className="text-[13px] text-gray-900 leading-tight mb-1"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: workshop.isActive ? 500 : 400 }}
                        >
                          {workshop.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${getStatusBadgeStyle(workshop.status)}`}
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            {workshop.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-gray-400" />
                            <span 
                              className="text-[10px] text-gray-500"
                              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                            >
                              {workshop.participants}
                            </span>
                          </div>
                        </div>
                        <p 
                          className="text-[11px] text-gray-500 mt-1"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                        >
                          {workshop.metadata}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}