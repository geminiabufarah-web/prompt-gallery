import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Folder, 
  Tag as TagIcon, 
  Cpu, 
  Star, 
  Calendar, 
  RotateCcw, 
  ArrowDownUp, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    collections, 
    tags, 
    entries, 
    filters, 
    setFilters, 
    resetFilters 
  } = useApp();

  // Extract unique model names from entries
  const availableModels = Array.from(
    new Set(entries.map(e => e.model_name).filter(Boolean))
  ) as string[];

  const handleTagToggle = (tagId: string) => {
    setFilters(prev => {
      const exists = prev.selectedTagIds.includes(tagId);
      return {
        ...prev,
        selectedTagIds: exists
          ? prev.selectedTagIds.filter(id => id !== tagId)
          : [...prev.selectedTagIds, tagId],
      };
    });
  };

  const hasActiveFilters = 
    filters.searchQuery !== '' ||
    filters.selectedCollectionId !== null ||
    filters.selectedTagIds.length > 0 ||
    filters.selectedModel !== null ||
    filters.onlyFavorites ||
    filters.dateRange.from !== null ||
    filters.dateRange.to !== null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside 
        className={`fixed lg:sticky top-16 right-0 z-30 h-[calc(100vh-4rem)] w-72 bg-surface-200/95 lg:bg-transparent border-l lg:border-l-0 lg:border-r border-surface-border p-4 overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6 pb-12">
          
          {/* Header & Reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>فلاتر وتصنيفات</span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          {/* Favorites quick toggle */}
          <div>
            <button
              onClick={() => setFilters(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                filters.onlyFavorites
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-surface-100/60 border-surface-border text-slate-300 hover:bg-surface-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${filters.onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span>المفضلة فقط ⭐</span>
              </div>
              {filters.onlyFavorites && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-purple-400" />
              <span>ترتيب النتائج</span>
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full bg-surface-100/80 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="rating">الأعلى تقييماً ⭐</option>
              <option value="prompt">أبجدياً حسب البرومبت</option>
            </select>
          </div>

          {/* Collections Section */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>المجموعات</span>
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, selectedCollectionId: null }))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  filters.selectedCollectionId === null
                    ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                    : 'text-slate-300 hover:bg-surface-100/80'
                }`}
              >
                <span>جميع المجموعات</span>
                <span className="text-[10px] text-slate-400 bg-surface-100 px-1.5 py-0.5 rounded-full">{entries.length}</span>
              </button>

              {collections.map(col => {
                const count = entries.filter(e => e.collection_id === col.id).length;
                const isSelected = filters.selectedCollectionId === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => setFilters(prev => ({ ...prev, selectedCollectionId: isSelected ? null : col.id }))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                        : 'text-slate-300 hover:bg-surface-100/80'
                    }`}
                  >
                    <span className="truncate">{col.name}</span>
                    <span className="text-[10px] text-slate-400 bg-surface-100 px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Models Filter */}
          {availableModels.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>نموذج الذكاء الاصطناعي</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableModels.map(model => {
                  const isSelected = filters.selectedModel === model;
                  return (
                    <button
                      key={model}
                      onClick={() => setFilters(prev => ({ ...prev, selectedModel: isSelected ? null : model }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/10'
                          : 'bg-surface-100/60 border-surface-border text-slate-400 hover:text-slate-200 hover:bg-surface-100'
                      }`}
                    >
                      {model}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>الوسوم ({tags.length})</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {tags.map(tag => {
                  const isSelected = filters.selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        isSelected
                          ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-sm shadow-fuchsia-500/10'
                          : 'bg-surface-100/60 border-surface-border text-slate-400 hover:text-slate-200 hover:bg-surface-100'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>نطاق التاريخ</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">من:</span>
                <input
                  type="date"
                  value={filters.dateRange.from || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value || null }
                  }))}
                  className="w-full bg-surface-100/80 border border-surface-border rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">إلى:</span>
                <input
                  type="date"
                  value={filters.dateRange.to || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value || null }
                  }))}
                  className="w-full bg-surface-100/80 border border-surface-border rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
