import type { Screen } from '../../App';
import {
  LayoutDashboard,
  HandCoins,
  Building2,
  Calculator,
  CalendarDays,
  BarChart3,
  FileText,
} from 'lucide-react';

const TABS: { id: Screen; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'grants', label: 'Grants', icon: HandCoins },
  { id: 'grantees', label: 'Directory', icon: Building2 },
  { id: 'calculator', label: 'Calc', icon: Calculator },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'history', label: 'History', icon: BarChart3 },
  { id: 'report', label: 'Report', icon: FileText },
];

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-card-border z-30 flex">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 min-h-[44px] transition-colors ${
              active ? 'text-purple' : 'text-warm-gray'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
