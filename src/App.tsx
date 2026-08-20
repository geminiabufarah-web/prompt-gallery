import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Gallery } from './components/Gallery';
import { EntryDetailsModal } from './components/EntryDetailsModal';
import { EntryFormModal } from './components/EntryFormModal';
import { DiffViewModal } from './components/DiffViewModal';
import { CompareViewModal } from './components/CompareViewModal';
import { CollectionsModal } from './components/CollectionsModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { ImageSplitCompareModal } from './components/ImageSplitCompareModal';
import { ToastContainer } from './components/Toast';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Navbar */}
      <Navbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex gap-6">
        {/* Sidebar Filters */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        {/* Gallery Feed */}
        <Gallery />
      </div>

      {/* Modals & Dialogs */}
      <EntryDetailsModal />
      <EntryFormModal />
      <DiffViewModal />
      <CompareViewModal />
      <ImageSplitCompareModal />
      <CollectionsModal />
      <SettingsModal />
      <LoginModal />

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
