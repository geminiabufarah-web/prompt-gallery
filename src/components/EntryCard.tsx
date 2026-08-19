import React, { useState } from 'react';
import { Entry } from '../types';
import { useApp } from '../context/AppContext';
import { Star, GitFork, Copy, Check, Eye, Images } from 'lucide-react';

interface EntryCardProps {
  entry: Entry;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const { 
    setSelectedEntryForDetails, 
    toggleFavorite, 
    isCompareSelectMode, 
    compareSelectedEntryIds, 
    toggleCompareEntrySelect,
    addToast
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSelectedForCompare = compareSelectedEntryIds.includes(entry.id);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(entry.prompt_positive);
    setCopied(true);
    addToast('تم نسخ البرومبت إلى الحافظة', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    if (isCompareSelectMode) {
      toggleCompareEntrySelect(entry.id);
    } else {
      setSelectedEntryForDetails(entry);
    }
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(entry.id);
  };

  const hasVersions = (entry.children && entry.children.length > 0) || entry.parent_entry_id;
  const imageCount = entry.images?.length || 1;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl overflow-hidden bg-surface-100/90 border transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 ${
        isSelectedForCompare
          ? 'border-cyan-500 ring-2 ring-cyan-500/50 scale-[0.99]'
          : 'border-surface-border hover:border-purple-500/40'
      }`}
    >
      {/* Image Container with Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-200">
        <img
          src={imgError ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80' : (entry.thumbnail_path || entry.image_path)}
          alt={entry.prompt_positive.slice(0, 50)}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges & Controls */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
          
          {/* Compare Checkbox, Multi-image Badge, or Version Tag */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isCompareSelectMode ? (
              <div 
                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                  isSelectedForCompare
                    ? 'bg-cyan-500 border-cyan-400 text-white shadow-md'
                    : 'bg-black/60 backdrop-blur-md border-white/20 text-transparent'
                }`}
              >
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <>
                {imageCount > 1 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-sm">
                    <Images className="w-3 h-3" />
                    <span>{imageCount} صور</span>
                  </span>
                )}
                {hasVersions && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-purple-500/40 text-purple-300 shadow-sm">
                    <GitFork className="w-3 h-3 text-purple-400" />
                    <span>نسخ</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Favorite Star Button */}
          <button
            onClick={handleStarClick}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
              entry.is_favorite
                ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50 shadow-md'
                : 'bg-black/40 text-slate-400 hover:text-amber-400 border border-white/10 opacity-0 group-hover:opacity-100'
            }`}
            title={entry.is_favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Star className={`w-3.5 h-3.5 ${entry.is_favorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Hover Overlay with Prompt Preview */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 z-10">
          
          {/* Prompt Snippet */}
          <p className="text-xs text-slate-100 font-medium line-clamp-3 leading-relaxed mb-2 drop-shadow-md text-left font-mono" dir="ltr">
            {entry.prompt_positive}
          </p>

          {/* Tags & Model badges */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
              {entry.model_name && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/30 border border-purple-500/40 text-purple-200 font-medium">
                  {entry.model_name}
                </span>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-medium">
                  #{entry.tags[0].name}
                  {entry.tags.length > 1 && ` +${entry.tags.length - 1}`}
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyPrompt}
                className="p-1.5 rounded-lg bg-surface-100/90 hover:bg-surface-50 border border-surface-border text-slate-200 hover:text-white transition-colors"
                title="نسخ البرومبت"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEntryForDetails(entry);
                }}
                className="p-1.5 rounded-lg bg-surface-100/90 hover:bg-surface-50 border border-surface-border text-slate-200 hover:text-white transition-colors"
                title="عرض التفاصيل"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Card Minimal Info Footer */}
      <div className="p-3 bg-surface-100/60 border-t border-surface-border/50 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-300 truncate">
          {entry.collection?.name || 'بدون مجموعة'}
        </span>
        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
          {new Date(entry.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};
