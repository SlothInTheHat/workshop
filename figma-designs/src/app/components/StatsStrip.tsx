import { Activity, Users as UsersIcon, Lightbulb } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-4 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
      <div className="text-gray-400">
        {icon}
      </div>
      <div>
        <p 
          className="text-[11px] text-gray-500 mb-0.5"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          {label}
        </p>
        <p 
          className="text-xl text-gray-900"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function StatsStrip() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard 
        icon={<Activity className="w-5 h-5" />}
        label="Active Workshops"
        value="2"
      />
      <StatCard 
        icon={<UsersIcon className="w-5 h-5" />}
        label="Total Participants"
        value="27"
      />
      <StatCard 
        icon={<Lightbulb className="w-5 h-5" />}
        label="Insights Generated"
        value="64"
      />
    </div>
  );
}
