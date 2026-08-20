import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Copy, 
  Columns, 
  GitCompare, 
  ExternalLink, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  Images,
  CheckCircle2,
  AlertCircle,
  Check,
  Layers,
  Sparkles,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { calculateLevenshteinRatio } from '../lib/similarity';
import { Entry } from '../types';

/**
 * Helper to check exact equality and similarity percentage between two prompt strings
 */
function getPromptMatchStatus(textA: string, textB: string): { isExact: boolean; percentage: number } {
  const cleanA = (textA || '').trim();
  const cleanB = (textB || '').trim();
  
  if (cleanA === cleanB) {
    return { isExact: true, percentage: 100 };
  }
  
  const ratio = calculateLevenshteinRatio(cleanA, cleanB);
  return { 
    isExact: false, 
    percentage: Math.min(99, Math.round(ratio * 100)) 
  };
}

export const CompareViewModal: React.FC = () => {
  const { 
    isCompareModalOpen, 
    closeCompareModal, 
    compareSelectedEntryIds, 
    toggleCompareEntrySelect, 
    entries, 
    openDiffModal,
    mergeEntries,
    openImageSplitModal,
    addToast 
  } = useApp();

  // Active image index per entry ID
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const [isMergingId, setIsMergingId] = useState<string | null>(null);
  
  // Custom professional confirmation dialog state
  const [mergeTarget, setMergeTarget] = useState<{ sourceEntry: Entry; sourceIdx: number } | null>(null);

  if (!isCompareModalOpen) return null;

  const comparedEntries = entries.filter(e => compareSelectedEntryIds.includes(e.id));
  const primaryEntry = comparedEntries[0];

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

  const handleConfirmMerge = async () => {
    if (!mergeTarget || !primaryEntry) return;
    const { sourceEntry } = mergeTarget;

    try {
      setIsMergingId(sourceEntry.id);
      await mergeEntries(primaryEntry.id, sourceEntry.id);
      toggleCompareEntrySelect(sourceEntry.id);
      setMergeTarget(null);
    } catch (err) {
      console.error('Merge failed:', err);
    } finally {
      setIsMergingId(null);
    }
  };

  // Check match status for 2 items comparison
  const pairMatchStatus = comparedEntries.length === 2 
    ? getPromptMatchStatus(comparedEntries[0].prompt_positive, comparedEntries[1].prompt_positive)
    : null;

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

          <div className="flex items-center gap-2">
            {comparedEntries.length === 2 && (
              <button
                onClick={() => {
                  closeCompareModal();
                  openImageSplitModal(
                    { url: comparedEntries[0].image_path, prompt: comparedEntries[0].prompt_positive, model: comparedEntries[0].model_name || undefined },
                    { url: comparedEntries[1].image_path, prompt: comparedEntries[1].prompt_positive, model: comparedEntries[1].model_name || undefined }
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all shadow-sm"
                title="فتح الصورتين في سلايدر المقارنة التفاعلي"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">سلايدر المقارنة التفاعلي</span>
              </button>
            )}

            <button
              onClick={closeCompareModal}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Match Status Summary Banner for 2 Compared Items */}
        {pairMatchStatus && (
          <div className="px-6 pt-4 shrink-0">
            {pairMatchStatus.isExact ? (
              <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>البرومبتان متطابقان بنسبة 100% (تطابق حرفي تام بدون أي اختلاف)</span>
                </div>
                <button
                  onClick={() => setMergeTarget({ sourceEntry: comparedEntries[1], sourceIdx: 1 })}
                  disabled={isMergingId === comparedEntries[1].id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
                  title="نقل صور هذا البرومبت المكرر إلى #1 وحذفه"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isMergingId === comparedEntries[1].id ? 'جاري الدمج...' : 'دمج الصور في #1 وحذف المكرر'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>يوجد اختلاف بين نصي البرومبت</span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className="text-[11px] text-slate-400 font-sans">نسبة التطابق:</span>
                  <span className="bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-200">
                    {pairMatchStatus.percentage}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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

              // Calculate match status against the first reference item
              const matchWithRef = idx > 0 
                ? getPromptMatchStatus(comparedEntries[0].prompt_positive, entry.prompt_positive)
                : null;

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

                  {/* Index label & Header Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        عنصر #{idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          البرومبت الأساسي
                        </span>
                      )}
                    </div>
                    {entry.is_favorite && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                  </div>

                  {/* Image with carousel arrows if multi-image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black/50 border border-surface-border">
                    <img
                      src={currentImg.thumbnail_path || currentImg.image_path}
                      alt=""
                      loading="lazy"
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-emerald-400">البرومبت الإيجابي</span>
                        
                        {/* Match Badges & Merge Button */}
                        {comparedEntries.length >= 2 && (
                          idx === 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-50 text-slate-400 border border-surface-border">
                              المرجع #1
                            </span>
                          ) : matchWithRef ? (
                            <>
                              {matchWithRef.isExact ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>متطابق 100% مع #1</span>
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-400" />
                                  <span>تطابق {matchWithRef.percentage}% مع #1</span>
                                </span>
                              )}

                              {/* Professional Merge with #1 Button */}
                              <button
                                onClick={() => setMergeTarget({ sourceEntry: entry, sourceIdx: idx })}
                                disabled={isMergingId === entry.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                title="نقل صور هذا الإدخال إلى البرومبت #1 وحذف هذا الإدخال المكرر"
                              >
                                <Layers className="w-3 h-3 text-purple-400" />
                                <span>{isMergingId === entry.id ? 'جاري الدمج...' : 'دمج مع #1'}</span>
                              </button>
                            </>
                          ) : null
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyPrompt(entry.prompt_positive)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="نسخ البرومبت"
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

      {/* Professional Custom Merge Confirmation Modal */}
      {mergeTarget && primaryEntry && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-surface-200 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header with Glowing Icon */}
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-fuchsia-600/30 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10 shrink-0">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>تأكيد دمج البرومبتات ونقل الصور</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  سيتم نقل وسائط العنصر المكرر إلى البرومبت الأساسي وتنظيف المكتبة
                </p>
              </div>
              <button
                onClick={() => setMergeTarget(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Merge Diagram */}
            <div className="p-4 rounded-2xl bg-surface-100/90 border border-surface-border flex items-center justify-between gap-3">
              {/* Source Element (To be deleted) */}
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-rose-500/40 bg-black/40 shadow-md">
                  <img
                    src={mergeTarget.sourceEntry.thumbnail_path || mergeTarget.sourceEntry.image_path}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-bold text-rose-300">
                    #{mergeTarget.sourceIdx + 1}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  <span>سيتم حذفه</span>
                </span>
              </div>

              {/* Transfer Arrow */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2">
                <span className="text-[10px] font-bold text-purple-400 mb-1">نقل الصور</span>
                <div className="p-2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>

              {/* Target Element (Primary #1) */}
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-black/40 shadow-md">
                  <img
                    src={primaryEntry.thumbnail_path || primaryEntry.image_path}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-bold text-emerald-300">
                    #1
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>البرومبت الأساسي</span>
                </span>
              </div>
            </div>

            {/* Explanation Note / Details */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-surface-300/40 border border-surface-border text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>إضافة كافة صور العنصر #{mergeTarget.sourceIdx + 1} إلى بطاقة البرومبت #1</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400 font-medium">
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>حذف الإدخال المكرر #{mergeTarget.sourceIdx + 1} نهائياً لتوفير المساحة ومنع التكرار</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-medium pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>هذا الإجراء نهائي ولا يمكن التراجع عنه بعد التأكيد</span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMergeTarget(null)}
                disabled={isMergingId !== null}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-300 hover:text-white transition-all disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={isMergingId !== null}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Layers className="w-4 h-4" />
                <span>{isMergingId ? 'جاري تنفيذ الدمج...' : 'تأكيد الدمج والحذف'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
