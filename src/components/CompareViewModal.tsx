import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Columns, GitCompare, ExternalLink, Star, ChevronRight, ChevronLeft, Images } from 'lucide-react';
import { Entry } from '../types';

export const CompareViewModal: React.FC = () => {
  const { 
    isCompareModalOpen, 
    closeCompareModal, 
    compareSelectedEntryIds, 
    toggleCompareEntrySelect, 
    entries, 
    openDiffModal,
    addToast 
  } = useApp();

  // Active image index per entry ID
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  if (!isCompareModalOpen) return null;

  const comparedEntries = entries.filter(e => compareSelectedEntryIds.includes(e.id));

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('تم نسخ البرومبت 📋', 'success');
  };

  const handlePrevImg = (entryId: string, count: number) => {
    setActiveImageIndices(prev => {
      const current = prev[entryId] || 0;
      return {
        ...prev,
        [entryId]: current === 0 ? count - 1 : current - 1,
      };
    });
  };

  const handleNextImg = (entryId: string, count: number) => {
    setActiveImageIndices(prev => {
      const current = prev[entryId] || 0;
      return {
        ...prev,
        [entryId]: current === count - 1 ? 0 : current + 1,
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-7xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                المقارنة الجانبية الشاملة (Side-by-Side Comparison)
              </h3>
              <p className="text-xs text-slate-400">مقارنة وتدقيق {comparedEntries.length} إدخالات جنباً إلى جنب</p>
            </div>
          </div>

          <button
            onClick={closeCompareModal}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid Columns */}
        <div className="overflow-x-auto overflow-y-auto p-6 flex-1">
          <div 
            className="grid gap-6 min-w-full"
            style={{ 
              gridTemplateColumns: `repeat(${comparedEntries.length}, minmax(300px, 1fr))` 
            }}
          >
            {comparedEntries.map((entry, idx) => {
              const imageList = (entry.images && entry.images.length > 0)
                ? entry.images
                : [{ id: 'main', image_path: entry.image_path, thumbnail_path: entry.thumbnail_path, is_primary: true }];
              
              const activeIdx = activeImageIndices[entry.id] || 0;
              const currentImg = imageList[activeIdx] || imageList[0];

              return (
                <div 
                  key={entry.id}
                  className="flex flex-col gap-4 p-4 rounded-2xl bg-surface-100/80 border border-surface-border relative"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => toggleCompareEntrySelect(entry.id)}
                    className="absolute top-3 left-3 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-slate-300 hover:text-white z-10 transition-colors"
                    title="إزالة من المقارنة"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Index label */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      عنصر #{idx + 1}
                    </span>
                    {entry.is_favorite && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                  </div>

                  {/* Image with carousel arrows if multi-image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black/50 border border-surface-border">
                    <img
                      src={currentImg.image_path || currentImg.thumbnail_path}
                      alt=""
                      className="w-full h-full object-contain"
                    />

                    {imageList.length > 1 && (
                      <>
                        <button
                          onClick={() => handlePrevImg(entry.id, imageList.length)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleNextImg(entry.id, imageList.length)}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-cyan-300 font-bold flex items-center gap-1">
                          <Images className="w-3 h-3" />
                          <span>{activeIdx + 1}/{imageList.length}</span>
                        </span>
                      </>
                    )}

                    <a
                      href={currentImg.image_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90"
                      title="فتح بالحجم الكامل"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Positive Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400">البرومبت الإيجابي</span>
                      <button
                        onClick={() => handleCopyPrompt(entry.prompt_positive)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="نسخ"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-300/80 text-xs font-mono text-slate-200 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap text-left" dir="ltr">
                      {entry.prompt_positive}
                    </div>
                  </div>

                  {/* Negative Prompt */}
                  {entry.prompt_negative && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-rose-400">البرومبت السلبي</span>
                      <div className="p-2.5 rounded-xl bg-surface-300/80 text-xs font-mono text-rose-200/90 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap text-left" dir="ltr">
                        {entry.prompt_negative}
                      </div>
                    </div>
                  )}

                  {/* Parameters Table */}
                  <div className="p-3 rounded-xl bg-surface-300/50 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">النموذج:</span>
                      <span className="font-semibold text-slate-200">{entry.model_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seed:</span>
                      <span className="font-mono text-slate-200">{entry.seed || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Steps:</span>
                      <span className="font-mono text-slate-200">{entry.steps || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CFG:</span>
                      <span className="font-mono text-slate-200">{entry.cfg_scale || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المجموعة:</span>
                      <span className="text-slate-200 truncate">{entry.collection?.name || 'بدون مجموعة'}</span>
                    </div>
                  </div>

                  {/* Diff with other entries buttons */}
                  {comparedEntries.length > 1 && (
                    <div className="pt-2 border-t border-surface-border">
                      <span className="text-[10px] text-slate-400 block mb-1">مقارنة الفروقات النصية مع:</span>
                      <div className="flex flex-wrap gap-1">
                        {comparedEntries.filter(other => other.id !== entry.id).map((other) => (
                          <button
                            key={other.id}
                            onClick={() => openDiffModal(entry, other)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-medium"
                          >
                            <GitCompare className="w-3 h-3" />
                            <span>مع #{comparedEntries.indexOf(other) + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
