import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { WorkshopDashboard } from './components/WorkshopDashboard';
import { WorkshopSetup } from './components/WorkshopSetup';
import { WorkshopLive } from './components/WorkshopLive';
import { WorkshopSummary } from './components/WorkshopSummary';

type Screen = 'dashboard' | 'setup' | 'live' | 'summary';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <TopNav onLogoClick={() => setCurrentScreen('dashboard')} />
      
      {currentScreen === 'dashboard' && (
        <WorkshopDashboard 
          onCreateWorkshop={() => setCurrentScreen('setup')}
          onOpenWorkshop={() => setCurrentScreen('live')}
        />
      )}
      
      {currentScreen === 'setup' && (
        <WorkshopSetup 
          onStartWorkshop={() => setCurrentScreen('live')}
        />
      )}
      
      {currentScreen === 'live' && (
        <WorkshopLive 
          onCompleteWorkshop={() => setCurrentScreen('summary')}
        />
      )}
      
      {currentScreen === 'summary' && (
        <WorkshopSummary />
      )}
    </div>
  );
}

export default App;