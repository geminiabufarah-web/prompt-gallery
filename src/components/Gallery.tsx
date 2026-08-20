import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EntryCard } from './EntryCard';
import { LayoutGrid, Grid3X3, Grid2X2, Sparkles, Plus, ImageOff, Columns, X, Lock, LogIn } from 'lucide-react';

export const Gallery: React.FC = () => {
  const { 
    filteredEntries, 
    entries, 
    filters, 
    setFilters, 
    openEntryForm, 
    setIsLoginModalOpen,
    isLoading,
    isCompareSelectMode,
    toggleCompareSelectMode,
    compareSelectedEntryIds,
    clearCompareSelection,
    openCompareModal
  } = useApp();

  const { user } = useAuth();

  const getGridColsClass = () => {
    switch (filters.gridSize) {
      case 'small':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'medium':
      default:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }
  };

  return (
    <div className="flex-1 min-w-0 pb-20">
      
      {/* Gallery Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>المعرض</span>
            {user && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'إدخال' : 'إدخالات'}
              </span>
            )}
          </h2>
        </div>

        {/* Grid Sizing Switcher (only if logged in) */}
        {user && (
          <div className="flex items-center gap-1 bg-surface-100/90 border border-surface-border p-1 rounded-xl">
            <button
              onClick={() => setFilters(prev => ({ ...prev, gridSize: 'small' }))}
              className={`p-1.5 rounded-lg transition-all ${
                filters.gridSize === 'small'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-50'
              }`}
              title="شبكة مصغرة"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, gridSize: 'medium' }))}
              className={`p-1.5 rounded-lg transition-all ${
                filters.gridSize === 'medium'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-50'
              }`}
              title="شبكة متوسطة"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, gridSize: 'large' }))}
              className={`p-1.5 rounded-lg transition-all ${
                filters.gridSize === 'large'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-50'
              }`}
              title="شبكة كبيرة"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* If Not Logged In */}
      {!user ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl border border-dashed border-purple-500/30 bg-surface-100/40 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-slate-100">
              سجل الدخول لعرض وإدارة برومبتاتك
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              لحماية خصوصية المحتوى، لا تظهر البرومبتات إلا بعد تسجيل الدخول. قم بتسجيل الدخول بحسابك أو أنشئ حساباً جديداً للوصول إلى مساحتك الخاصة.
            </p>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول / إنشاء حساب جديد</span>
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton */
        <div className={`grid ${getGridColsClass()}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-surface-100/60 border border-surface-border animate-pulse" />
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className={`grid ${getGridColsClass()}`}>
          {filteredEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        /* Empty State for Logged-In User */
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-surface-border bg-surface-100/30">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
            {entries.length === 0 ? (
              <Sparkles className="w-8 h-8" />
            ) : (
              <ImageOff className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            {entries.length === 0 ? 'لا توجد أي برومبتات في حسابك بعد' : 'لا توجد نتائج مطابقة لبحثك'}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            {entries.length === 0
              ? 'ابدأ بإضافة أول صورة وبرومبت لحفظها في مكتبتك الخاصة ومقارنتها لاحقاً.'
              : 'جرب تغيير كلمات البحث أو إعادة تعيين الفلاتر لعرض مزيد من الصور.'}
          </p>

          {entries.length === 0 ? (
            <button
              onClick={() => openEntryForm()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول برومبت الآن</span>
            </button>
          ) : (
            <button
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '', selectedCollectionId: null, selectedTagIds: [], selectedModel: null, onlyFavorites: false }))}
              className="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-xs text-slate-300 transition-colors"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      )}

      {/* Floating Compare Action Bar */}
      {isCompareSelectMode && user && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-lg z-40 px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-200/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-100">
                  تم تحديد {compareSelectedEntryIds.length} من الإدخالات
                </p>
                <p className="text-[10px] text-slate-400">حدد إدخالين أو أكثر لمقارنتها معاً</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {compareSelectedEntryIds.length >= 2 && (
                <button
                  onClick={openCompareModal}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md shadow-cyan-600/30 transition-all"
                >
                  فتح المقارنة
                </button>
              )}
              {compareSelectedEntryIds.length > 0 && (
                <button
                  onClick={clearCompareSelection}
                  className="p-1.5 text-slate-400 hover:text-slate-200 text-xs"
                  title="مسح التحديد"
                >
                  مسح
                </button>
              )}
              <button
                onClick={toggleCompareSelectMode}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="إلغاء وضع المقارنة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
