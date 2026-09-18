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

const MainLayout: React.FC = () => {
  const { isLoggedIn, role, largeFont, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSelfRegistering, setIsSelfRegistering] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (role === 'USER') {
      setCurrentTab('kiosk');
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

  // 100% Pure Full-Screen Face Scanner Kiosk Mode (No Navbar, No Footer)
  if (currentTab === 'kiosk') {
    return (
      <SeniorKiosk
        onExit={() => {
          if (role === 'USER') {
            logout();
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 ${largeFont ? 'text-lg leading-relaxed' : 'text-sm'}`}>
      {/* Top Navigation (DataPulse Light SaaS Style) */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        wsConnected={wsConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative">
        {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
        {currentTab === 'live' && <LiveRecognition />}
        {currentTab === 'register' && <RegisterPerson onSuccessNavigate={() => setCurrentTab('live')} />}
        {currentTab === 'people' && <PeopleDirectory onRegisterClick={() => setCurrentTab('register')} />}
        {currentTab === 'attendance' && <AttendanceLog />}
        {currentTab === 'settings' && <VoiceSettings />}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <p className="flex items-center gap-2 font-medium">
          <span className="font-bold text-slate-800">FaceVoice AI Platform</span>
          <span className="text-slate-300">•</span>
          <span>Real-time Face Recognition & Voice Synthesizer Platform</span>
        </p>
        <p className="text-emerald-600 font-mono font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Sync Online</span>
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
