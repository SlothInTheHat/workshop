import { Sun, HelpCircle } from 'lucide-react';
import logo from 'figma:asset/9832ddf9258f642ca77be19766503a9da1a8954b.png';

const tabs = ['Workshop', 'Use Cases', 'Agency', 'Reports'];

interface TopNavProps {
  onLogoClick?: () => void;
}

export function TopNav({ onLogoClick }: TopNavProps) {
  return (
    <div className="h-16 bg-[#fafafa] border-b border-[#E5E2DD] px-6 flex items-center justify-between">
      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="flex items-center hover:opacity-80 transition-opacity"
      >
        <img src={logo} alt="Optura" className="h-10" />
      </button>

      {/* Tabs */}
      <nav className="flex items-center gap-1">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-[13px] transition-colors ${
              index === 0
                ? 'bg-[#F5F3F0] text-gray-900'
                : 'text-gray-700 hover:bg-[#F5F3F0]'
            }`}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: index === 0 ? 500 : 400 }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F5F3F0] transition-colors">
          <Sun className="w-[18px] h-[18px] text-gray-600" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F5F3F0] transition-colors">
          <HelpCircle className="w-[18px] h-[18px] text-gray-600" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#4A5568] hover:bg-[#2D3748] transition-colors">
          <span className="text-white text-[11px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>A</span>
        </button>
      </div>
    </div>
  );
}