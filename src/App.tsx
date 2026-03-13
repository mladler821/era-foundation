import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { AuthContext, useAuthProvider, useAuth } from './hooks/useAuth';
import { YearContext } from './hooks/useYear';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Grants from './pages/Grants';
import Grantees from './pages/Grantees';
import Calculator from './pages/Calculator';
import BudgetPlanner from './pages/BudgetPlanner';
import Calendar from './pages/Calendar';
import History from './pages/History';
import Report from './pages/Report';

export type Screen =
  | 'dashboard'
  | 'grants'
  | 'grantees'
  | 'calculator'
  | 'budget'
  | 'calendar'
  | 'history'
  | 'report';

function AppShell() {
  const { user, loading: authLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [availableYears, setAvailableYears] = useState<string[]>(['2025']);

  // WHY: Listen to the years collection to populate the year selector dynamically.
  // New years appear instantly when added to Firestore.
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'years'), (snapshot) => {
      const years = snapshot.docs.map((d) => d.id).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        setAvailableYears(years);
        // WHY: If the currently selected year no longer exists, fall back to the most recent
        setSelectedYear((prev) => (years.includes(prev) ? prev : years[0]));
      }
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-warm-gray-lt flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-warm-gray text-[14px]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const screenComponent = () => {
    switch (currentScreen) {
      case 'dashboard': return <Dashboard />;
      case 'grants': return <Grants />;
      case 'grantees': return <Grantees />;
      case 'calculator': return <Calculator />;
      case 'budget': return <BudgetPlanner />;
      case 'calendar': return <Calendar />;
      case 'history': return <History />;
      case 'report': return <Report />;
    }
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      <div className="min-h-screen bg-warm-gray-lt">
        <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />

        {/* Main content — offset for sidebar on desktop, bottom nav on mobile */}
        <main className="md:ml-[200px] pb-20 md:pb-0 p-4 md:p-6 max-w-5xl">
          {screenComponent()}
        </main>
      </div>
    </YearContext.Provider>
  );
}

export default function App() {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      <AppShell />
    </AuthContext.Provider>
  );
}
