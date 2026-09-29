import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { SelfRegister } from './pages/SelfRegister';
import { Dashboard } from './pages/Dashboard';
import { LiveRecognition } from './pages/LiveRecognition';
import { SeniorKiosk } from './pages/SeniorKiosk';
import { RegisterPerson } from './pages/RegisterPerson';
import { PeopleDirectory } from './pages/PeopleDirectory';
import { AttendanceLog } from './pages/AttendanceLog';
import { VoiceSettings } from './pages/VoiceSettings';
import { MobileOneStop } from './pages/MobileOneStop';
import { PTMachineKiosk } from './pages/PTMachineKiosk';
import { MotiPhysioAnalysis } from './pages/MotiPhysioAnalysis';

const MainLayout: React.FC = () => {
  const { isLoggedIn, role, largeFont, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'mobile-pt';
    }
    return 'dashboard';
  });
  const [isSelfRegistering, setIsSelfRegistering] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    // If mobile viewport on initial load or resize, default to mobile-pt
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setCurrentTab('mobile-pt');
    } else if (role === 'USER') {
      setCurrentTab('pt-kiosk');
    } else {
      setCurrentTab('dashboard');
    }
  }, [role]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/v1/system/health');
        if (res.ok) setWsConnected(true);
      } catch (err) {
        setWsConnected(false);
      }
    };
    checkHealth();
    const timer = setInterval(checkHealth, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-4">
        {isSelfRegistering ? (
          <SelfRegister
            onBackToLogin={() => setIsSelfRegistering(false)}
            onRegisteredSuccess={() => setIsSelfRegistering(false)}
          />
        ) : (
          <Login
            onSuccess={() => {}}
            onGoToRegister={() => setIsSelfRegistering(true)}
          />
        )}
      </div>
    );
  }

  // Pure Mobile One-Stop Service View
  if (currentTab === 'mobile-pt') {
    return (
      <MobileOneStop
        onSwitchToKiosk={() => setCurrentTab('pt-kiosk')}
        onExit={() => setCurrentTab('dashboard')}
      />
    );
  }

  // Pure Full-Screen Physical Therapy Machine Kiosk Mode
  if (currentTab === 'pt-kiosk') {
    return (
      <PTMachineKiosk
        onExit={() => setCurrentTab('dashboard')}
        onSwitchToMobile={() => setCurrentTab('mobile-pt')}
      />
    );
  }

  // 100% Pure Full-Screen Face Scanner Senior Kiosk Mode
  if (currentTab === 'kiosk') {
    return (
      <SeniorKiosk
        onExit={() => setCurrentTab('dashboard')}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#F8FAFB] text-slate-900 ${largeFont ? 'text-lg leading-relaxed' : 'text-sm'}`}>
      {/* Top Navigation (Ramathibodi & Mahidol Style) */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        wsConnected={wsConnected}
      />

      <main className="flex-1 max-w-[1760px] w-full mx-auto p-4 md:p-6 lg:p-8 relative">
        {currentTab === 'moti-physio' && (
          <MotiPhysioAnalysis
            onNavigateToKiosk={() => setCurrentTab('pt-kiosk')}
            onNavigateToMobile={() => setCurrentTab('mobile-pt')}
            onNavigateToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
        {currentTab === 'live' && <LiveRecognition />}
        {currentTab === 'register' && <RegisterPerson onSuccessNavigate={() => setCurrentTab('live')} />}
        {currentTab === 'people' && <PeopleDirectory onRegisterClick={() => setCurrentTab('register')} />}
        {currentTab === 'attendance' && <AttendanceLog />}
        {currentTab === 'settings' && <VoiceSettings />}
      </main>

      <footer className="border-t border-slate-200/90 bg-white/95 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[1760px] mx-auto w-full backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#008783] to-[#00A39E] text-white flex items-center justify-center text-[10px] font-black font-serif border border-teal-300 shadow-xs">
            MU
          </div>
          <span className="font-extrabold text-[#0F3D3E]">คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี และคณะกายภาพบำบัด มหาวิทยาลัยมหิดล</span>
          <span className="text-[#00A39E] font-bold">•</span>
          <span className="text-slate-600 font-medium">Ramathibodi Hospital & Faculty of Physical Therapy, Mahidol University</span>
        </div>
        <p className="text-[#008783] bg-[#E6F7F7] border border-[#B2EBE6] px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#00A39E] animate-ping" />
          <span>Ramathibodi Smart Care Network Online</span>
        </p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
