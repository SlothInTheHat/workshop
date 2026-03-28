import { Search, X } from 'lucide-react';

interface UsecaseCard {
  id: string;
  title: string;
  summary: string;
  value: 'High' | 'Medium' | 'Low';
  viability: 'High' | 'Medium' | 'Low';
  visibility: 'Internal' | 'Restricted' | 'Cross-Silo';
  addedBy: string;
  timestamp: string;
  position: { x: number; y: number };
  clusterId?: number;
  team?: string;
}

interface UsecaseListPopupProps {
  cards: UsecaseCard[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
}

const getValueColor = (level: string) => {
  switch (level) {
    case 'High': return 'bg-red-50 text-red-700 border-red-200';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low': return 'bg-gray-50 text-gray-600 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getViabilityColor = (level: string) => {
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

export function UsecaseListPopup({ cards, searchQuery, onSearchChange, onClose }: UsecaseListPopupProps) {
  const filteredCards = cards.filter(card => 
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="absolute top-0 right-16 bottom-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-50"
      style={{ 
        animation: 'slideInRight 0.25s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <h3 
            className="text-[14px] text-gray-900"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
          >
            Workshop Usecases
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search usecases..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Usecase List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAF9]">
          {filteredCards.length > 0 ? (
            filteredCards.map((card) => (
              <div 
                key={card.id} 
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#6B9695] hover:shadow-md transition-all cursor-pointer"
              >
                <h4 
                  className="text-[13px] text-gray-900 mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  {card.title}
                </h4>
                <p 
                  className="text-[12px] text-gray-600 mb-3"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                >
                  {card.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border ${getValueColor(card.value)}`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Value: {card.value}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border ${getViabilityColor(card.viability)}`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    Viability: {card.viability}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border ${getVisibilityColor(card.visibility)}`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    {card.visibility}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                    {card.addedBy}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                    {card.timestamp}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p 
                className="text-[13px] text-gray-500"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              >
                No usecases found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
