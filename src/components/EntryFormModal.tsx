import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../lib/storage';
import { findSimilarPrompts } from '../lib/similarity';
import { 
  X, 
  UploadCloud, 
  ImageIcon, 
  GitFork, 
  AlertCircle, 
  Sparkles, 
  Tag as TagIcon, 
  Folder, 
  Star, 
  Plus, 
  Loader2,
  Trash2,
  CheckCircle2,
  Images
} from 'lucide-react';
import { PromptSimilarityResult, Entry, EntryImage } from '../types';

const COMMON_MODELS = [
  'Midjourney v6',
  'Midjourney v5.2',
  'Flux.1 Dev',
  'Flux.1 Schnell',
  'SDXL 1.0',
  'Stable Diffusion 1.5',
  'DALL-E 3',
  'Ideogram 2.0',
  'Recraft v3',
];

interface LocalImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  thumbnailUrl: string;
  isPrimary: boolean;
}

export const EntryFormModal: React.FC = () => {
  const { 
    isEntryFormOpen, 
    closeEntryForm, 
    entryToEdit, 
    parentEntryForNew, 
    collections, 
    tags, 
    entries, 
    refreshData, 
    addToast 
  } = useApp();

  // Multi-image state
  const [imageItems, setImageItems] = useState<LocalImageItem[]>([]);

  // Prompt & metadata form fields
  const [promptPositive, setPromptPositive] = useState<string>('');
  const [promptNegative, setPromptNegative] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [seed, setSeed] = useState<string>('');
  const [steps, setSteps] = useState<string>('');
  const [cfgScale, setCfgScale] = useState<string>('');
  const [sampler, setSampler] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [parentEntryId, setParentEntryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Similarity alert state
  const [similarEntries, setSimilarEntries] = useState<PromptSimilarityResult[]>([]);
  const similarityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (entryToEdit) {
      const existingImgs: LocalImageItem[] = (entryToEdit.images && entryToEdit.images.length > 0)
        ? entryToEdit.images.map((img, i) => ({
            id: img.id || `img-${i}`,
            previewUrl: img.image_path,
            thumbnailUrl: img.thumbnail_path,
            isPrimary: img.is_primary ?? (i === 0),
          }))
        : [{
            id: 'img-main',
            previewUrl: entryToEdit.image_path,
            thumbnailUrl: entryToEdit.thumbnail_path,
            isPrimary: true,
          }];

      setImageItems(existingImgs);
      setPromptPositive(entryToEdit.prompt_positive);
      setPromptNegative(entryToEdit.prompt_negative || '');
      setModelName(COMMON_MODELS.includes(entryToEdit.model_name || '') ? entryToEdit.model_name! : 'custom');
      setCustomModel(COMMON_MODELS.includes(entryToEdit.model_name || '') ? '' : (entryToEdit.model_name || ''));
      setSeed(entryToEdit.seed || '');
      setSteps(entryToEdit.steps?.toString() || '');
      setCfgScale(entryToEdit.cfg_scale?.toString() || '');
      setSampler(entryToEdit.sampler || '');
      setCollectionId(entryToEdit.collection_id || '');
      setSelectedTagNames(entryToEdit.tags?.map(t => t.name) || []);
      setParentEntryId(entryToEdit.parent_entry_id || '');
      setNotes(entryToEdit.notes || '');
      setIsFavorite(entryToEdit.is_favorite || false);
      setRating(entryToEdit.rating || 0);
    } else {
      // New Entry
      setImageItems([]);
      setPromptNegative('');
      setSeed('');
      setSteps('');
      setCfgScale('');
      setSampler('');
      setSelectedTagNames([]);
      setTagInput('');
      setNotes('');
      setIsFavorite(false);
      setRating(0);

      if (parentEntryForNew) {
        setPromptPositive(parentEntryForNew.prompt_positive);
        setPromptNegative(parentEntryForNew.prompt_negative || '');
        setModelName(COMMON_MODELS.includes(parentEntryForNew.model_name || '') ? parentEntryForNew.model_name! : 'custom');
        setCustomModel(COMMON_MODELS.includes(parentEntryForNew.model_name || '') ? '' : (parentEntryForNew.model_name || ''));
        setSeed(parentEntryForNew.seed || '');
        setSteps(parentEntryForNew.steps?.toString() || '');
        setCfgScale(parentEntryForNew.cfg_scale?.toString() || '');
        setSampler(parentEntryForNew.sampler || '');
        setCollectionId(parentEntryForNew.collection_id || '');
        setSelectedTagNames(parentEntryForNew.tags?.map(t => t.name) || []);
        setParentEntryId(parentEntryForNew.id);
      } else {
        setPromptPositive('');
        setModelName('Midjourney v6');
        setCustomModel('');
        setCollectionId(collections[0]?.id || '');
        setParentEntryId('');
      }
    }
  }, [entryToEdit, parentEntryForNew, isEntryFormOpen]);

  // Real-time Similarity check (PRD Section 4.5)
  useEffect(() => {
    if (similarityTimeoutRef.current) {
      clearTimeout(similarityTimeoutRef.current);
    }

    if (!promptPositive.trim() || entryToEdit || parentEntryId) {
      setSimilarEntries([]);
      return;
    }

    similarityTimeoutRef.current = setTimeout(() => {
      const matches = findSimilarPrompts(promptPositive, entries, undefined, 75);
      setSimilarEntries(matches);
    }, 400);

    return () => {
      if (similarityTimeoutRef.current) clearTimeout(similarityTimeoutRef.current);
    };
  }, [promptPositive, entries, entryToEdit, parentEntryId]);

  if (!isEntryFormOpen) return null;

  const handleFilesAdded = (files: FileList | File[]) => {
    const newItems: LocalImageItem[] = [];
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      addToast('يرجى اختيار ملفات صور صالحة (JPG, PNG, WebP)', 'error');
      return;
    }

    validFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `new-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: url,
        thumbnailUrl: url,
        isPrimary: imageItems.length === 0 && index === 0,
      });
    });

    setImageItems(prev => {
      const combined = [...prev, ...newItems];
      // Ensure at least one primary exists
      if (!combined.some(item => item.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const setPrimaryImage = (id: string) => {
    setImageItems(prev =>
      prev.map(img => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const removeImageItem = (id: string) => {
    setImageItems(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleAddTag = (tagName: string) => {
    const clean = tagName.trim().replace(/^#/, '');
    if (clean && !selectedTagNames.includes(clean)) {
      setSelectedTagNames([...selectedTagNames, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTagNames(selectedTagNames.filter(t => t !== tagName));
  };

  const handleLinkSimilarAsParent = (similarEntry: Entry) => {
    setParentEntryId(similarEntry.id);
    if (!collectionId && similarEntry.collection_id) {
      setCollectionId(similarEntry.collection_id);
    }
    setSimilarEntries([]);
    addToast('تم ربط هذا الإدخال كنسخة فرعية من الإدخال المشابه 🔗', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptPositive.trim()) {
      addToast('البرومبت الإيجابي مطلوب', 'error');
      return;
    }

    if (imageItems.length === 0) {
      addToast('يرجى رفع صورة واحدة على الأقل', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      // Ensure all tags exist in DB/local storage and get their IDs
      const tagIds: string[] = [];
      for (const tName of selectedTagNames) {
        const createdTag = await StorageService.createTag(tName);
        tagIds.push(createdTag.id);
      }

      const finalModel = modelName === 'custom' ? customModel : modelName;
      const entryTempId = entryToEdit?.id || Date.now().toString();
      const userId = entryToEdit?.user_id || 'user';

      // Process and upload all images
      const uploadedImages: EntryImage[] = [];
      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        if (item.file) {
          const res = await StorageService.uploadSingleImageFile(item.file, userId, entryTempId, i);
          uploadedImages.push({
            id: `img-${Date.now()}-${i}`,
            image_path: res.imagePath,
            thumbnail_path: res.thumbnailPath,
            is_primary: item.isPrimary,
          });
        } else {
          // Existing image
          uploadedImages.push({
            id: item.id,
            image_path: item.previewUrl,
            thumbnail_path: item.thumbnailUrl,
            is_primary: item.isPrimary,
          });
        }
      }

      const primaryImg = uploadedImages.find(img => img.is_primary) || uploadedImages[0];

      if (entryToEdit) {
        // Updating existing entry
        await StorageService.updateEntry(entryToEdit.id, {
          prompt_positive: promptPositive,
          prompt_negative: promptNegative || null,
          model_name: finalModel || null,
          seed: seed || null,
          steps: steps ? parseInt(steps) : null,
          cfg_scale: cfgScale ? parseFloat(cfgScale) : null,
          sampler: sampler || null,
          collection_id: collectionId || null,
          parent_entry_id: parentEntryId || null,
          notes: notes || null,
          is_favorite: isFavorite,
          rating: rating || null,
          image_path: primaryImg.image_path,
          thumbnail_path: primaryImg.thumbnail_path,
          images: uploadedImages,
        }, tagIds);

        addToast('تم تحديث الإدخال ومعرض الصور بنجاح ✨', 'success');
      } else {
        // Creating new entry
        await StorageService.createEntry({
          image_path: primaryImg.image_path,
          thumbnail_path: primaryImg.thumbnail_path,
          images: uploadedImages,
          prompt_positive: promptPositive,
          prompt_negative: promptNegative || null,
          model_name: finalModel || null,
          seed: seed || null,
          steps: steps ? parseInt(steps) : null,
          cfg_scale: cfgScale ? parseFloat(cfgScale) : null,
          sampler: sampler || null,
          collection_id: collectionId || null,
          parent_entry_id: parentEntryId || null,
          notes: notes || null,
          is_favorite: isFavorite,
          rating: rating || null,
        }, tagIds);

        addToast(`تمت إضافة الإدخال مع ${uploadedImages.length} صور إلى المعرض 🎉`, 'success');
      }

      await refreshData();
      closeEntryForm();
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableParentEntries = entries.filter(e => !entryToEdit || e.id !== entryToEdit.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-5xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {entryToEdit ? 'تعديل الإدخال ومعرض الصور' : (parentEntryForNew ? 'إنشاء نسخة معدلة من البرومبت' : 'إضافة إدخال جديد مع صور متعددة')}
              </h3>
              <p className="text-xs text-slate-400">ارفع صورة واحدة أو عدة صور لنفس البرومبت، وسجل البيانات</p>
            </div>
          </div>

          <button
            onClick={closeEntryForm}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Multi-Image Upload Area (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Images className="w-4 h-4 text-purple-400" />
                  <span>معرض الصور ({imageItems.length}) <span className="text-rose-400">*</span></span>
                </label>
                <span className="text-[10px] text-slate-400">يمكنك رفع أكثر من صورة</span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all bg-surface-100/60 ${
                  isDragging
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-surface-border hover:border-purple-500/50 hover:bg-surface-100'
                }`}
                onClick={() => document.getElementById('multi-file-upload-input')?.click()}
              >
                <input
                  id="multi-file-upload-input"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
                />

                <div className="flex flex-col items-center gap-2 py-2 text-slate-400">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">اسحب وأفلت صورة أو عدة صور هنا</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">أو اضغط لتصفح ملفات جهازك معاً</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Images Preview List / Grid */}
              {imageItems.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    الصور المحددة (اضغط "تعيين كرئيسية" لاختيار غلاف المعرض):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {imageItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`group relative aspect-square rounded-xl overflow-hidden border bg-surface-300 transition-all ${
                          item.isPrimary
                            ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-md'
                            : 'border-surface-border hover:border-slate-500'
                        }`}
                      >
                        <img
                          src={item.previewUrl}
                          alt={`Uploaded ${idx}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Top action badge */}
                        <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between z-10">
                          {item.isPrimary ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-600 text-white flex items-center gap-1 shadow">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>الرئيسية</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(item.id)}
                              className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-black/60 hover:bg-purple-600 text-slate-200 hover:text-white backdrop-blur-sm transition-all"
                            >
                              تعيين كرئيسية
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImageItem(item.id)}
                            className="p-1 rounded-md bg-black/60 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-sm transition-colors"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Version Parent selector */}
              <div className="p-3.5 rounded-xl bg-surface-100/70 border border-surface-border space-y-2 mt-auto">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-purple-400" />
                  <span>ربط كنسخة معدّلة من:</span>
                </label>
                <select
                  value={parentEntryId}
                  onChange={(e) => setParentEntryId(e.target.value)}
                  className="w-full bg-surface-200 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">بدون ربط (إدخال أصل مستقل)</option>
                  {availableParentEntries.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.prompt_positive.slice(0, 40)}... ({e.model_name || 'بدون نموذج'})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Form Fields Area (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-4">
              
              {/* Positive Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>البرومبت الإيجابي (Positive Prompt) <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-mono">{promptPositive.length} حرف</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={promptPositive}
                  onChange={(e) => setPromptPositive(e.target.value)}
                  placeholder="e.g. A hyper-realistic cybernetic samurai in neon Tokyo, 8k octane render..."
                  className="w-full bg-surface-100/90 border border-surface-border rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed placeholder-slate-500 focus:outline-none focus:border-purple-500 text-left"
                  dir="ltr"
                />
              </div>

              {/* Similarity Alert Banner (PRD Section 4.5) */}
              {similarEntries.length > 0 && !parentEntryId && (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 animate-in fade-in space-y-2">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>تم اكتشاف برومبت مشابه بنسبة {similarEntries[0].similarityPercentage}%!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    هل ترغب في ربط هذا الإدخال كنسخة معدّلة من البرومبت السابق بدلاً من إنشاء إدخال منفصل؟
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLinkSimilarAsParent(similarEntries[0].entry)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
                    >
                      ربط كنسخة معدّلة منه 🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimilarEntries([])}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      تجاهل
                    </button>
                  </div>
                </div>
              )}

              {/* Negative Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-400 block">
                  البرومبت السلبي (Negative Prompt) <span className="text-[10px] text-slate-500">(اختياري)</span>
                </label>
                <textarea
                  rows={2}
                  value={promptNegative}
                  onChange={(e) => setPromptNegative(e.target.value)}
                  placeholder="e.g. blurry, low quality, bad anatomy, deformed..."
                  className="w-full bg-surface-100/90 border border-surface-border rounded-xl p-2.5 text-xs text-slate-100 font-mono leading-relaxed placeholder-slate-500 focus:outline-none focus:border-rose-500/50 text-left"
                  dir="ltr"
                />
              </div>

              {/* Model & Collection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">النموذج المستخدم</label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-surface-100 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {COMMON_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="custom">نموذج آخر (كتابة يدوية)...</option>
                  </select>
                  {modelName === 'custom' && (
                    <input
                      type="text"
                      placeholder="اسم النموذج..."
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full mt-1 bg-surface-100 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">المجموعة / المشروع</label>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full bg-surface-100 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">بدون مجموعة</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Generation Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Seed</label>
                  <input
                    type="text"
                    placeholder="428910..."
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="w-full bg-surface-100 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Steps</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="w-full bg-surface-100 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">CFG Scale</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="7.5"
                    value={cfgScale}
                    onChange={(e) => setCfgScale(e.target.value)}
                    className="w-full bg-surface-100 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Sampler</label>
                  <input
                    type="text"
                    placeholder="Euler a"
                    value={sampler}
                    onChange={(e) => setSampler(e.target.value)}
                    className="w-full bg-surface-100 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Tags Selector & Creator */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">الوسوم (Tags)</label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface-100 border border-surface-border min-h-[42px]">
                  {selectedTagNames.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="اكتب وسم ثم اضغط Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none flex-1 min-w-[120px]"
                  />
                </div>

                {/* Tag suggestions */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 ml-1">اقتراحات:</span>
                    {tags
                      .filter(t => !selectedTagNames.includes(t.name) && (!tagInput || t.name.toLowerCase().includes(tagInput.toLowerCase())))
                      .slice(0, 6)
                      .map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleAddTag(t.name)}
                          className="text-[10px] px-2 py-0.5 rounded bg-surface-50 hover:bg-surface-300 text-slate-400 hover:text-slate-200 border border-surface-border"
                        >
                          +{t.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">ملاحظات شخصية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات حول الإضاءة، التعديلات، تجارب معينة..."
                  className="w-full bg-surface-100 border border-surface-border rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Favorite & Rating */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-100 border border-surface-border">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-surface-200"
                  />
                  <span>تمييز كمفضلة ⭐</span>
                </label>

                {/* Rating 1 to 5 */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 ml-1">التقييم:</span>
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(rating === starVal ? 0 : starVal)}
                      className={`p-1 text-slate-500 hover:text-amber-400 transition-colors ${
                        rating >= starVal ? 'text-amber-400 fill-amber-400' : ''
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${rating >= starVal ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={closeEntryForm}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>{entryToEdit ? 'حفظ التعديلات' : 'إضافة إلى المعرض'}</span>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
