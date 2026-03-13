import { useAuth } from '../../hooks/useAuth';
import type { Screen } from '../../App';
import {
  LayoutDashboard,
  HandCoins,
  Building2,
  Calculator,
  Target,
  CalendarDays,
  BarChart3,
  FileText,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS: { id: Screen; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'grants', label: 'Grants', icon: HandCoins },
  { id: 'grantees', label: 'Grantees', icon: Building2 },
  { id: 'calculator', label: '5% Calculator', icon: Calculator },
  { id: 'budget', label: 'Budget Planner', icon: Target },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'history', label: 'History', icon: BarChart3 },
  { id: 'report', label: 'Annual Report', icon: FileText },
];

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-[200px] bg-white border-r border-card-border h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-4 border-b border-card-border">
        <img
          src="/logo.png"
          alt="Ella Riley Adler Foundation"
          className="w-[140px] mx-auto"
        />
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-purple-light text-purple-dark border-l-[3px] border-purple'
                  : 'text-warm-gray hover:bg-warm-gray-lt border-l-[3px] border-transparent'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-3 border-t border-card-border">
        <div className="text-[12px] text-warm-gray truncate mb-2">
          {profile?.displayName}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-[12px] text-warm-gray hover:text-purple transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
