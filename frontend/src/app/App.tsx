import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HomePage } from '../pages/Home/HomePage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { PatientPage } from '../pages/Patient/PatientPage';
import { ExercisePage } from '../pages/Exercise/ExercisePage';
import { TrainingPage } from '../pages/Training/TrainingPage';
import { ResultPage } from '../pages/Result/ResultPage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { LoginPage } from '../pages/Login/LoginPage';
import { EnrollmentPage } from '../pages/Enrollment/EnrollmentPage';
import { FaceAuthModal } from '../components/FaceAuth/FaceAuthModal';
import { PrivacyConsentModal } from '../components/Privacy/PrivacyConsentModal';
import { PrivacyCenterModal } from '../components/Privacy/PrivacyCenterModal';
import { ArchitectureModal } from '../components/Architecture/ArchitectureModal';
import { CompetitionDemoModal } from '../components/Competition/CompetitionDemoModal';
import { SeniorEmergencyButton } from '../components/SeniorMode/SeniorEmergencyButton';
import { usePatientStore } from '../store/patientStore';
import { useExerciseStore } from '../store/exerciseStore';
import { useSeniorStore } from '../store/seniorStore';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isCompetitionDemoOpen, setIsCompetitionDemoOpen] = useState<boolean>(false);
  const { fetchPatients, isFaceAuthOpen, faceAuthMode, closeFaceAuth } = usePatientStore();
  const fetchExercises = useExerciseStore((s) => s.fetchExercises);
  const { isSeniorMode } = useSeniorStore();

  useEffect(() => {
    fetchPatients();
    fetchExercises();
  }, [fetchPatients, fetchExercises]);

  return (
    <div
      className={`h-[100dvh] min-h-screen bg-[#F8FAF9] text-[#1F2937] flex flex-col selection:bg-emerald-200 selection:text-emerald-900 transition-all overflow-hidden ${
        isSeniorMode ? 'senior-mode text-base' : ''
      }`}
    >
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        onOpenCompetitionDemo={() => setIsCompetitionDemoOpen(true)}
      />

      <main className="flex-1 overflow-y-auto overscroll-contain max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 safe-area-left safe-area-right">
        {currentTab === 'home' && <HomePage onNavigate={setCurrentTab} />}
        {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
        {currentTab === 'patients' && <PatientPage onNavigate={setCurrentTab} />}
        {currentTab === 'exercises' && <ExercisePage onNavigate={setCurrentTab} />}
        {currentTab === 'training' && <TrainingPage onNavigate={setCurrentTab} />}
        {currentTab === 'result' && <ResultPage onNavigate={setCurrentTab} />}
        {currentTab === 'history' && <HistoryPage onNavigate={setCurrentTab} />}
        {currentTab === 'reports' && <ReportsPage onNavigate={setCurrentTab} />}
        {currentTab === 'settings' && <SettingsPage />}
        {currentTab === 'login' && <LoginPage onNavigate={setCurrentTab} />}
        {currentTab === 'enrollment' && <EnrollmentPage onNavigate={setCurrentTab} />}
      </main>

      {/* Global Face Auth Modal (Elderly-Friendly Face Login & Enrollment) */}
      <FaceAuthModal
        isOpen={isFaceAuthOpen}
        onClose={closeFaceAuth}
        initialMode={faceAuthMode}
      />

      {/* Edge Biometric Privacy & Protection Consent Modal */}
      <PrivacyConsentModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Dedicated Privacy Center Modal (Privacy-by-Design Architecture) */}
      <PrivacyCenterModal
        isOpen={isPrivacyCenterOpen}
        onClose={() => setIsPrivacyCenterOpen(false)}
      />

      {/* Winning 3-5 Minute Competition Demo Modal */}
      <CompetitionDemoModal
        isOpen={isCompetitionDemoOpen}
        onClose={() => setIsCompetitionDemoOpen(false)}
        onNavigateToTab={(tab) => {
          setCurrentTab(tab);
          setIsCompetitionDemoOpen(false);
        }}
      />

      {/* System Architecture & AI Pipeline Modal (Competition Judges) */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        onNavigateToDemoStep={(stepId) => {
          if (stepId === 'identify' || stepId === 'verify') {
            usePatientStore.getState().openFaceAuth('login');
          } else if (stepId === 'calibrate' || stepId === 'analyze' || stepId === 'protect') {
            setCurrentTab('training');
          } else if (stepId === 'improve' || stepId === 'adapt' || stepId === 'approve') {
            setCurrentTab('history');
          }
          setIsArchitectureModalOpen(false);
        }}
        onOpenApprovalGate={() => {
          setCurrentTab('history');
          setIsArchitectureModalOpen(false);
        }}
      />

      {/* Floating Senior Mode Emergency SOS Button */}
      <SeniorEmergencyButton />

      {/* Clinical Footer */}
      <footer className="border-t border-emerald-100 bg-white/95 backdrop-blur-md py-6 text-center text-xs text-slate-500 font-sans mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <strong>Strong Care v1.0</strong> &bull; ระบบช่วยติดตามและวิเคราะห์การฝึกกายภาพด้วย AI เพื่อความปลอดภัยและการฟื้นฟูที่เหมาะสม
          </span>
          <span className="text-slate-400 text-[11px]">
            React + TypeScript + Vite + MediaPipe + PHP 8.x + MySQL &bull; Privacy-Oriented Edge AI
          </span>
        </div>
      </footer>
    </div>
  );
};
