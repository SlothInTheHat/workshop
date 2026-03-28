import { MoreHorizontal, MessageSquare, ArrowUp, Sparkles } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { useRef, useState } from 'react';

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
  upvotes?: number;
  comments?: number;
  team?: string;
  collaborators?: string[];
  crossTeamOverlap?: string;
}

interface DraggableUsecaseCardProps {
  card: UsecaseCard;
  onMove: (id: string, left: number, top: number) => void;
  onUpvote?: (id: string) => void;
  onComment?: (id: string) => void;
  onOpenAIChat?: (id: string) => void;
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

export function DraggableUsecaseCard({ card, onMove, onUpvote, onComment, onOpenAIChat }: DraggableUsecaseCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isUpvoted, setIsUpvoted] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'USECASE_CARD',
    item: { id: card.id, left: card.position.x, top: card.position.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      if (offset && ref.current) {
        const parent = ref.current.offsetParent;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const left = offset.x - parentRect.left;
          const top = offset.y - parentRect.top;
          onMove(card.id, left, top);
        }
      }
    },
  });

  drag(ref);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpvoted(!isUpvoted);
    onUpvote?.(card.id);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(card.id);
  };

  const handleAIChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenAIChat?.(card.id);
  };

  return (
    <div
      ref={ref}
      className="absolute bg-white rounded-xl border border-gray-200 p-4 w-72 shadow-lg hover:shadow-xl transition-all cursor-move group"
      style={{
        left: `${card.position.x}px`,
        top: `${card.position.y}px`,
        boxShadow: card.clusterId === 1 
          ? '0 4px 20px rgba(107, 150, 149, 0.12), 0 0 0 2px rgba(107, 150, 149, 0.08)' 
          : '0 4px 16px rgba(0, 0, 0, 0.08)',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 
          className="text-[13px] text-gray-900 flex-1"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
        >
          {card.title}
        </h4>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <p 
        className="text-[12px] text-gray-600 mb-3"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
      >
        {card.summary}
      </p>

      {/* Collaborators */}
      {card.collaborators && card.collaborators.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5">
          {card.collaborators.map((collaborator, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 border border-gray-200"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            >
              👤 {collaborator.split(' ')[0]}
            </span>
          ))}
        </div>
      )}

      {/* Team badge */}
      {card.team && (
        <div className="mb-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            {card.team}
          </span>
        </div>
      )}

      {/* Cross-team overlap badge */}
      {card.crossTeamOverlap && (
        <div className="mb-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 border border-purple-200"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Also seen in {card.crossTeamOverlap}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
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

      {/* Interaction Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-[10px] ${
              isUpvoted 
                ? 'bg-[#6B9695] text-white' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            title="Upvote"
          >
            <ArrowUp className="w-3 h-3" />
            {(card.upvotes || 0) + (isUpvoted ? 1 : 0)}
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-[10px]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            title="Comment"
          >
            <MessageSquare className="w-3 h-3" />
            {card.comments || 0}
          </button>
        </div>

        <button
          onClick={handleAIChat}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F0F9F9] text-[#6B9695] transition-colors text-[10px]"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          title="Continue with AI"
        >
          <Sparkles className="w-3 h-3" />
          AI
        </button>
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
  );
}