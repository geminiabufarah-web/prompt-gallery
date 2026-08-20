import React, { useState, useEffect, useRef } from 'react';
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
  Sliders,
  CheckCircle2
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

  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-none">
                معرض البرومبتات
              </h1>
              <span className="text-[10px] text-purple-400 font-mono tracking-wider">PROMPT GALLERY</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative group">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-400 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ابحث في البرومبت، النماذج، البارامترات، الملاحظات..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-surface-100/80 border border-surface-border rounded-2xl pr-10 pl-10 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500/60 focus:bg-surface-100 transition-all shadow-inner"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
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
            title="الإعدادات وضغط الصور والنسخ الاحتياطي"
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

          {/* Auth State Button & Dropdown */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all ${
                  isUserMenuOpen 
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 ring-2 ring-purple-500/20' 
                    : 'bg-surface-100/80 hover:bg-surface-50 border-surface-border text-slate-300 hover:text-white'
                }`}
                title="قائمة الحساب"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  {(user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate text-slate-200">
                  {user.user_metadata?.name || user.email?.split('@')[0] || 'حسابي'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 py-2 bg-surface-200 border border-surface-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-surface-border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-300 font-semibold">متصل حالياً</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {user.user_metadata?.name || 'مستخدم مسجل'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                      {user.email}
                    </p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-right text-xs text-slate-300 hover:text-white hover:bg-surface-100 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <span>تبديل الحساب / دخول آخر</span>
                      <LogIn className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full px-3 py-2 text-right text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl flex items-center justify-between transition-colors font-medium"
                    >
                      <span>تسجيل الخروج</span>
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all"
              title="تسجيل الدخول أو إنشاء حساب جديد"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">دخول / حساب جديد</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
