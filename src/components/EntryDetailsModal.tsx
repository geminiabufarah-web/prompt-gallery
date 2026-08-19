import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Copy, 
  Check, 
  Star, 
  Trash2, 
  Edit3, 
  GitFork, 
  GitCompare, 
  ExternalLink, 
  Plus, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Images
} from 'lucide-react';
import { Entry } from '../types';

export const EntryDetailsModal: React.FC = () => {
  const { 
    selectedEntryForDetails, 
    setSelectedEntryForDetails, 
    openEntryForm, 
    openDiffModal, 
    toggleFavorite, 
    deleteEntry, 
    entries,
    addToast 
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedEntryForDetails?.id]);

  if (!selectedEntryForDetails) return null;

  const entry = selectedEntryForDetails;
  const imageList = (entry.images && entry.images.length > 0)
    ? entry.images
    : [{ id: 'main', image_path: entry.image_path, thumbnail_path: entry.thumbnail_path, is_primary: true }];

  const currentImage = imageList[activeImageIndex] || imageList[0];

  // Find parent and children from entries list
  const parentEntry = entry.parent_entry_id 
    ? entries.find(e => e.id === entry.parent_entry_id) || null
    : null;

  const childEntries = entries.filter(e => e.parent_entry_id === entry.id);

  // All related entries for quick comparison selection
  const allRelatedEntries = [
    ...(parentEntry ? [parentEntry] : []),
    ...childEntries
  ];

  const handleCopyPositive = () => {
    navigator.clipboard.writeText(entry.prompt_positive);
    setCopiedPos(true);
    addToast('تم نسخ البرومبت الإيجابي 📋', 'success');
    setTimeout(() => setCopiedPos(false), 2000);
  };

  const handleCopyNegative = () => {
    if (!entry.prompt_negative) return;
    navigator.clipboard.writeText(entry.prompt_negative);
    setCopiedNeg(true);
    addToast('تم نسخ البرومبت السلبي 📋', 'success');
    setTimeout(() => setCopiedNeg(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإدخال نهائياً؟')) return;
    setIsDeleting(true);
    await deleteEntry(entry.id);
    setIsDeleting(false);
    setSelectedEntryForDetails(null);
  };

  const handleCreateVariant = () => {
    openEntryForm(null, entry);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {entry.collection?.name || 'بدون مجموعة'}
            </span>
            {entry.model_name && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-50 text-slate-300 border border-surface-border">
                {entry.model_name}
              </span>
            )}
            {imageList.length > 1 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Images className="w-3.5 h-3.5" />
                <span>{activeImageIndex + 1} / {imageList.length}</span>
              </span>
            )}
          </div>

          {/* Action Header Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(entry.id)}
              className={`p-2 rounded-xl border transition-all ${
                entry.is_favorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-surface-100 border-surface-border text-slate-400 hover:text-amber-400'
              }`}
              title="المفضلة"
            >
              <Star className={`w-4 h-4 ${entry.is_favorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => openEntryForm(entry)}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-300 hover:text-white transition-colors"
              title="تعديل الإدخال"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl bg-surface-100 hover:bg-rose-500/20 border border-surface-border hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
              title="حذف الإدخال"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-6 bg-surface-border mx-1" />

            <button
              onClick={() => setSelectedEntryForDetails(null)}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Side: Multi-Image Gallery & Version Tree */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Main Active Image Display */}
              <div className="relative group rounded-2xl overflow-hidden border border-surface-border bg-black/40 shadow-inner aspect-square flex items-center justify-center">
                <img
                  src={currentImage.image_path || currentImage.thumbnail_path}
                  alt={entry.prompt_positive.slice(0, 50)}
                  className="w-full h-full object-contain max-h-[460px] transition-all duration-300"
                />

                {/* Left/Right Navigation Arrows if multiple images */}
                {imageList.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 opacity-80 hover:opacity-100 transition-all"
                      title="الصورة السابقة"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleNextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 opacity-80 hover:opacity-100 transition-all"
                      title="الصورة التالية"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}

                <a
                  href={currentImage.image_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 left-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                  title="فتح الصورة بالحجم الكامل"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Thumbnails Carousel Strip if multi-image */}
              {imageList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-xl bg-surface-100/60 border border-surface-border">
                  {imageList.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-purple-500 ring-2 ring-purple-500/30 scale-105'
                          : 'border-surface-border opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.thumbnail_path || img.image_path} alt="" className="w-full h-full object-cover" />
                      {img.is_primary && (
                        <span className="absolute bottom-0 inset-x-0 bg-purple-600/90 text-white text-[8px] font-bold text-center">
                          رئيسية
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Version Management Action */}
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-100/60 border border-surface-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-purple-400" />
                    <span>إدارة نسخ وتعديلات البرومبت</span>
                  </span>
                  <button
                    onClick={handleCreateVariant}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إنشاء نسخة معدّلة</span>
                  </button>
                </div>

                {/* Tree Relations List */}
                {allRelatedEntries.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {/* Parent */}
                    {parentEntry && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-surface-200 border border-surface-border">
                        <div 
                          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                          onClick={() => setSelectedEntryForDetails(parentEntry)}
                        >
                          <img 
                            src={parentEntry.thumbnail_path || parentEntry.image_path} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover border border-surface-border"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-purple-400 block">الأصل (Parent)</span>
                            <p className="text-xs text-slate-300 truncate font-mono" dir="ltr">{parentEntry.prompt_positive}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openDiffModal(parentEntry, entry)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors shrink-0 mr-2"
                          title="مقارنة الفروقات النصية مع الأصل"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>مقارنة الفروقات</span>
                        </button>
                      </div>
                    )}

                    {/* Children */}
                    {childEntries.map(child => (
                      <div key={child.id} className="flex items-center justify-between p-2 rounded-xl bg-surface-200 border border-surface-border">
                        <div 
                          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                          onClick={() => setSelectedEntryForDetails(child)}
                        >
                          <img 
                            src={child.thumbnail_path || child.image_path} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover border border-surface-border"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-emerald-400 block">نسخة فرعية مشتقة</span>
                            <p className="text-xs text-slate-300 truncate font-mono" dir="ltr">{child.prompt_positive}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openDiffModal(entry, child)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors shrink-0 mr-2"
                          title="مقارنة الفروقات النصية"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>مقارنة الفروقات</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">لا توجد نسخ مرتبطة بهذا الإدخال حتى الآن.</p>
                )}
              </div>
            </div>

            {/* Right Side: Prompts & Metadata */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* Positive Prompt Card */}
              <div className="p-4 rounded-2xl bg-surface-100/90 border border-surface-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>البرومبت الإيجابي (Positive Prompt)</span>
                  </label>
                  <button
                    onClick={handleCopyPositive}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-surface-50 hover:bg-surface-200 border border-surface-border text-slate-200 hover:text-white transition-all"
                  >
                    {copiedPos ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPos ? 'تم النسخ!' : 'نسخ البرومبت'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-300/80 border border-surface-border/80 text-sm text-slate-100 font-mono leading-relaxed select-text whitespace-pre-wrap text-left" dir="ltr">
                  {entry.prompt_positive}
                </div>
              </div>

              {/* Negative Prompt Card */}
              {entry.prompt_negative && (
                <div className="p-4 rounded-2xl bg-surface-100/90 border border-surface-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <span>البرومبت السلبي (Negative Prompt)</span>
                    </label>
                    <button
                      onClick={handleCopyNegative}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-surface-50 hover:bg-surface-200 border border-surface-border text-slate-200 hover:text-white transition-all"
                    >
                      {copiedNeg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNeg ? 'تم النسخ!' : 'نسخ السلبي'}</span>
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-300/80 border border-surface-border/80 text-sm text-rose-200/90 font-mono leading-relaxed select-text whitespace-pre-wrap text-left" dir="ltr">
                    {entry.prompt_negative}
                  </div>
                </div>
              )}

              {/* Generation Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-surface-100/50 border border-surface-border">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">النموذج</span>
                  <span className="text-xs font-semibold text-slate-200">{entry.model_name || 'غير محدد'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Seed</span>
                  <span className="text-xs font-mono font-semibold text-slate-200">{entry.seed || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Steps</span>
                  <span className="text-xs font-mono font-semibold text-slate-200">{entry.steps || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">CFG Scale</span>
                  <span className="text-xs font-mono font-semibold text-slate-200">{entry.cfg_scale || '—'}</span>
                </div>
                {entry.sampler && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium">Sampler</span>
                    <span className="text-xs font-mono font-semibold text-slate-200">{entry.sampler}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block font-medium">تاريخ الإنشاء</span>
                  <span className="text-xs font-medium text-slate-300">
                    {new Date(entry.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Tags Section */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="p-4 rounded-2xl bg-surface-100/50 border border-surface-border">
                  <span className="text-xs font-bold text-slate-300 block mb-2">الوسوم (Tags):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map(tag => (
                      <span key={tag.id} className="text-xs px-2.5 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-medium">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {entry.notes && (
                <div className="p-4 rounded-2xl bg-surface-100/50 border border-surface-border">
                  <span className="text-xs font-bold text-slate-300 block mb-1.5">الملاحظات الشخصية:</span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
