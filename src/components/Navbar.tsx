import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  FolderOpen, 
  Settings, 
  User as UserIcon, 
  Columns, 
  X,
  LogIn,
  LogOut,
  Sliders
} from 'lucide-react';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { 
    filters, 
    setFilters, 
    openEntryForm, 
    setIsCollectionsModalOpen, 
    setIsSettingsModalOpen, 
    setIsLoginModalOpen,
    isCompareSelectMode,
    toggleCompareSelectMode,
    compareSelectedEntryIds,
    openCompareModal,
    openImageSplitModal
  } = useApp();

  const { user, isConfigured, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-surface-border bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Sidebar Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-xl border transition-all ${
              isSidebarOpen 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                : 'bg-surface-100/80 border-surface-border text-slate-300 hover:text-white hover:bg-surface-50'
            }`}
            title="الفلاتر والتصنيفات"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Prompt Gallery
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">أرشيف ومكتبة البرومبتات</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative group">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="ابحث في البرومبت، النماذج، الملاحظات، أو الوسوم..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-9 pr-10 py-2 text-sm bg-surface-100/90 hover:bg-surface-50 focus:bg-surface-200 border border-surface-border focus:border-purple-500/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Compare Mode Toggle */}
          <button
            onClick={toggleCompareSelectMode}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
              isCompareSelectMode
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'bg-surface-100/80 border-surface-border text-slate-300 hover:text-white hover:bg-surface-50'
            }`}
            title="مقارنة متعددة للصور والبرومبتات"
          >
            <Columns className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">
              {isCompareSelectMode ? `مقارنة (${compareSelectedEntryIds.length})` : 'مقارنة'}
            </span>
          </button>

          {/* Interactive Split Slider Compare Button */}
          <button
            onClick={() => openImageSplitModal()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-fuchsia-500/15 hover:from-cyan-500/25 hover:to-fuchsia-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white transition-all shadow-sm"
            title="مقارنة تفاعلية لأي صورتين بسلايدر فاصل في المنتصف"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">سلايدر المقارنة</span>
          </button>

          {/* If comparing and items selected, show open compare */}
          {isCompareSelectMode && compareSelectedEntryIds.length >= 2 && (
            <button
              onClick={openCompareModal}
              className="px-3 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/30 transition-all animate-pulse"
            >
              عرض المقارنة ({compareSelectedEntryIds.length})
            </button>
          )}

          {/* Collections Modal Button */}
          <button
            onClick={() => setIsCollectionsModalOpen(true)}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-xl bg-surface-100/80 hover:bg-surface-50 border border-surface-border text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            title="إدارة المجموعات"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">المجموعات</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-xl bg-surface-100/80 hover:bg-surface-50 border border-surface-border text-slate-300 hover:text-white transition-all"
            title="الإعدادات والنسخ الاحتياطي"
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          {/* Add New Entry Button (Primary) */}
          <button
            onClick={() => openEntryForm()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-600/25 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إضافة إدخال جديد</span>
            <span className="sm:hidden">إضافة</span>
          </button>

          {/* Auth State Button */}
          {user ? (
            <div className="relative group">
              <button
                className="p-2 rounded-xl bg-surface-100 border border-surface-border text-purple-400 hover:text-purple-300 transition-all"
                title={`مسجل كـ ${user.email || 'المستخدم'}`}
              >
                <UserIcon className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 py-1.5 bg-surface-200 border border-surface-border rounded-xl shadow-2xl hidden group-hover:block transition-all z-40">
                <div className="px-3 py-1.5 border-b border-surface-border text-[11px] text-slate-400 truncate">
                  {user.email || 'المستخدم'}
                </div>
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-right text-xs text-rose-400 hover:bg-rose-500/10 flex items-center justify-between"
                >
                  <span>تسجيل الخروج</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="p-2 rounded-xl bg-surface-100 border border-surface-border text-slate-300 hover:text-white"
              title="تسجيل الدخول"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
