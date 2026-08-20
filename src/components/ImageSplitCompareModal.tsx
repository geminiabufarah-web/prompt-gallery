import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Search, 
  Sparkles, 
  ArrowLeftRight, 
  Check, 
  Sliders, 
  RotateCcw, 
  Layers, 
  Eye, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Copy,
  Info
} from 'lucide-react';
import { Entry, EntryImage } from '../types';

interface SelectedImageInfo {
  url: string;
  thumbnailUrl: string;
  prompt: string;
  model?: string;
  entryId: string;
  imageId: string;
}

export const ImageSplitCompareModal: React.FC = () => {
  const { 
    isImageSplitModalOpen, 
    closeImageSplitModal, 
    entries, 
    splitModalInitialImages,
    addToast 
  } = useApp();

  const [selectedImageA, setSelectedImageA] = useState<SelectedImageInfo | null>(null);
  const [selectedImageB, setSelectedImageB] = useState<SelectedImageInfo | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Slider interaction state
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'blend' | 'sideBySide'>('split');
  const [blendOpacity, setBlendOpacity] = useState<number>(50); // 0 to 100%

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize with passed images if any
  useEffect(() => {
    if (splitModalInitialImages && splitModalInitialImages[0] && splitModalInitialImages[1]) {
      const a = splitModalInitialImages[0];
      const b = splitModalInitialImages[1];
      setSelectedImageA({
        url: a.url,
        thumbnailUrl: a.url,
        prompt: a.prompt,
        model: a.model,
        entryId: 'init-a',
        imageId: 'img-a',
      });
      setSelectedImageB({
        url: b.url,
        thumbnailUrl: b.url,
        prompt: b.prompt,
        model: b.model,
        entryId: 'init-b',
        imageId: 'img-b',
      });
      setIsComparing(true);
    } else {
      setIsComparing(false);
    }
  }, [splitModalInitialImages, isImageSplitModalOpen]);

  // Handle Dragging calculations
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!isImageSplitModalOpen) return null;

  const handleImageClick = (entry: Entry, img: EntryImage, imgUrl: string, thumbUrl: string) => {
    const info: SelectedImageInfo = {
      url: imgUrl,
      thumbnailUrl: thumbUrl,
      prompt: entry.prompt_positive,
      model: entry.model_name || undefined,
      entryId: entry.id,
      imageId: img.id,
    };

    if (!selectedImageA) {
      setSelectedImageA(info);
      addToast('تم اختيار الصورة الأولى (A) 🎨', 'info');
    } else if (selectedImageA.url === info.url) {
      setSelectedImageA(null);
    } else if (!selectedImageB) {
      setSelectedImageB(info);
      addToast('تم اختيار الصورة الثانية (B) 🌟', 'info');
    } else if (selectedImageB.url === info.url) {
      setSelectedImageB(null);
    } else {
      // If both selected, replace B
      setSelectedImageB(info);
      addToast('تم تحديث الصورة الثانية (B)', 'info');
    }
  };

  const handleSwap = () => {
    const temp = selectedImageA;
    setSelectedImageA(selectedImageB);
    setSelectedImageB(temp);
    addToast('تم تبديل ترتيب الصورتين (A ⇄ B)', 'info');
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('تم نسخ البرومبت إلى الحافظة', 'success');
  };

  // Filter entries in picker mode
  const filteredEntries = entries.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.prompt_positive.toLowerCase().includes(q) ||
      (e.model_name && e.model_name.toLowerCase().includes(q)) ||
      (e.collection?.name && e.collection.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-7xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[96vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-purple-600/30 text-cyan-300 border border-cyan-500/40 shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>سلايدر مقارنة الصور التفاعلي</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Interactive Split Viewer
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isComparing 
                  ? 'حرّك الخط الفاصل في المنتصف لليمين واليسار لمقارنة أدق تفاصيل الصورتين'
                  : 'اختر صورتين من المعرض للبدء في المقارنة التفاعلية الشاملة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isComparing && (
              <>
                <button
                  onClick={handleSwap}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-200 hover:text-white transition-all shadow-sm"
                  title="تبديل الصورتين A ⇄ B"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">تبديل (A ⇄ B)</span>
                </button>

                <button
                  onClick={() => setIsComparing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-200 hover:text-white transition-all shadow-sm"
                  title="تغيير الصور المختارة"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  <span>تغيير الصور</span>
                </button>
              </>
            )}

            <button
              onClick={closeImageSplitModal}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODE 1: INTERACTIVE SPLIT SLIDER COMPARISON */}
        {isComparing && selectedImageA && selectedImageB ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col">
            
            {/* Mode Selector & Control Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap px-2">
              {/* View Modes */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-100 border border-surface-border">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'split'
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>سلايدر فاصل (Split)</span>
                </button>

                <button
                  onClick={() => setViewMode('blend')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'blend'
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>تلاشي شفاف (Opacity Blend)</span>
                </button>

                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'sideBySide'
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>جنباً إلى جنب</span>
                </button>
              </div>

              {/* Quick Jump Buttons */}
              {viewMode === 'split' && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>موضع الفاصل:</span>
                  <button
                    onClick={() => setSliderPosition(25)}
                    className="px-2 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-300 font-mono text-[11px]"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setSliderPosition(50)}
                    className="px-2 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 border border-surface-border text-cyan-300 font-mono text-[11px] font-bold"
                  >
                    50% (المنتصف)
                  </button>
                  <button
                    onClick={() => setSliderPosition(75)}
                    className="px-2 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-300 font-mono text-[11px]"
                  >
                    75%
                  </button>
                </div>
              )}

              {viewMode === 'blend' && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>نسبة الشفافية:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blendOpacity}
                    onChange={(e) => setBlendOpacity(Number(e.target.value))}
                    className="w-32 accent-purple-500 cursor-pointer"
                  />
                  <span className="font-mono text-purple-300 font-bold">{blendOpacity}%</span>
                </div>
              )}
            </div>

            {/* MAIN INTERACTIVE CANVAS */}
            {viewMode === 'split' && (
              <div 
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                className="relative w-full h-[58vh] sm:h-[64vh] bg-black/80 rounded-3xl border border-surface-border overflow-hidden select-none cursor-ew-resize shadow-2xl flex items-center justify-center"
              >
                {/* Layer 1: Image A (Underneath) */}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <img
                    src={selectedImageA.url}
                    alt="Image A"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Layer 2: Image B (Top Layer with Clip-path) */}
                <div 
                  className="absolute inset-0 flex items-center justify-center p-2 overflow-hidden pointer-events-none"
                  style={{
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                  }}
                >
                  <img
                    src={selectedImageB.url}
                    alt="Image B"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Draggable Divider Line & Handle */}
                <div 
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  {/* Vertical Line */}
                  <div className="w-[2.5px] h-full bg-gradient-to-b from-cyan-400 via-white to-purple-500 shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                  
                  {/* Circular Glow Handle */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-surface-100/95 border-2 border-white text-slate-800 shadow-2xl flex items-center justify-center backdrop-blur-md">
                    <div className="flex items-center text-slate-200">
                      <ChevronLeft className="w-3.5 h-3.5 -mr-1" />
                      <ChevronRight className="w-3.5 h-3.5 -ml-1" />
                    </div>
                  </div>
                </div>

                {/* Left Badge: Image A Info */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-auto">
                  <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>الصورة B (اليسار)</span>
                    {selectedImageB.model && (
                      <span className="text-[10px] text-slate-300 font-normal border-r border-white/20 pr-1.5 mr-1">
                        {selectedImageB.model}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Badge: Image B Info */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-auto">
                  <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span>الصورة A (اليمين)</span>
                    {selectedImageA.model && (
                      <span className="text-[10px] text-slate-300 font-normal border-r border-white/20 pr-1.5 mr-1">
                        {selectedImageA.model}
                      </span>
                    )}
                  </div>
                </div>

                {/* Range Slider for Mobile / Accessibility */}
                <div className="absolute bottom-3 inset-x-6 z-20 pointer-events-auto max-w-md mx-auto bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-cyan-400 shrink-0">B</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-50 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] font-bold text-purple-400 shrink-0">A</span>
                  <span className="text-xs font-mono font-bold text-white shrink-0">{Math.round(sliderPosition)}%</span>
                </div>
              </div>
            )}

            {/* OPACITY BLEND VIEW */}
            {viewMode === 'blend' && (
              <div className="relative w-full h-[58vh] sm:h-[64vh] bg-black/80 rounded-3xl border border-surface-border overflow-hidden shadow-2xl flex items-center justify-center p-2">
                {/* Base Image A */}
                <img
                  src={selectedImageA.url}
                  alt="Base A"
                  className="absolute inset-0 w-full h-full object-contain p-2"
                />
                {/* Blended Image B */}
                <img
                  src={selectedImageB.url}
                  alt="Blend B"
                  style={{ opacity: blendOpacity / 100 }}
                  className="absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-75"
                />
              </div>
            )}

            {/* SIDE BY SIDE VIEW */}
            {viewMode === 'sideBySide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[58vh] sm:h-[64vh]">
                {/* Side A */}
                <div className="relative rounded-3xl bg-black/80 border border-cyan-500/30 overflow-hidden flex flex-col p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-300">الصورة A (الأساسية)</span>
                    <a href={selectedImageA.url} target="_blank" rel="noreferrer" className="p-1 rounded bg-white/10 text-white">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <img src={selectedImageA.url} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Side B */}
                <div className="relative rounded-3xl bg-black/80 border border-purple-500/30 overflow-hidden flex flex-col p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-300">الصورة B (المقارنة)</span>
                    <a href={selectedImageB.url} target="_blank" rel="noreferrer" className="p-1 rounded bg-white/10 text-white">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <img src={selectedImageB.url} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            )}

            {/* PROMPT DETAILS ACCORDION FOR BOTH IMAGES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Prompt A */}
              <div className="p-4 rounded-2xl bg-surface-100/70 border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">برومبت الصورة A</span>
                    {selectedImageA.model && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {selectedImageA.model}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(selectedImageA.prompt)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="نسخ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap text-left" dir="ltr">
                  {selectedImageA.prompt}
                </p>
              </div>

              {/* Prompt B */}
              <div className="p-4 rounded-2xl bg-surface-100/70 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400">برومبت الصورة B</span>
                    {selectedImageB.model && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {selectedImageB.model}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(selectedImageB.prompt)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="نسخ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap text-left" dir="ltr">
                  {selectedImageB.prompt}
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* MODE 2: PICKER SELECTION GRID */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            
            {/* Instructions & Search Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>انقر على أي صورة لاختيارها كـ <strong>(الصورة A)</strong> ثم انقر على صورة ثانية كـ <strong>(الصورة B)</strong></span>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث في البرومبت والنماذج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-xs bg-surface-100 border border-surface-border rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Entries and Images Grid Grouped by Prompt */}
            <div className="space-y-6 flex-1">
              {filteredEntries.map((entry, entryIdx) => {
                const imageList: EntryImage[] = (entry.images && entry.images.length > 0)
                  ? entry.images
                  : [{ id: `img-${entry.id}`, image_path: entry.image_path, thumbnail_path: entry.thumbnail_path, is_primary: true }];

                return (
                  <div 
                    key={entry.id}
                    className="p-4 rounded-2xl bg-surface-100/70 border border-surface-border space-y-3"
                  >
                    {/* Prompt Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          إدخال #{entryIdx + 1}
                        </span>
                        {entry.model_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-50 text-slate-300 border border-surface-border">
                            {entry.model_name}
                          </span>
                        )}
                        {entry.collection && (
                          <span className="text-[10px] text-slate-400">
                            📁 {entry.collection.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-cyan-300 font-medium">
                        {imageList.length} {imageList.length === 1 ? 'صورة' : 'صور'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-300 line-clamp-2 leading-relaxed text-left" dir="ltr">
                      {entry.prompt_positive}
                    </p>

                    {/* Images Horizontal Thumbnails */}
                    <div className="flex items-center gap-3 overflow-x-auto p-1.5">
                      {imageList.map((img, imgIdx) => {
                        const imgUrl = img.image_path;
                        const thumbUrl = img.thumbnail_path || img.image_path;
                        const isSelectedA = selectedImageA?.url === imgUrl;
                        const isSelectedB = selectedImageB?.url === imgUrl;

                        return (
                          <div
                            key={img.id || imgIdx}
                            onClick={() => handleImageClick(entry, img, imgUrl, thumbUrl)}
                            className={`group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all shadow-md shrink-0 hover:scale-105 ${
                              isSelectedA
                                ? 'border-cyan-400 ring-4 ring-cyan-500/30 scale-105'
                                : isSelectedB
                                ? 'border-fuchsia-400 ring-4 ring-fuchsia-500/30 scale-105'
                                : 'border-surface-border hover:border-white/40'
                            }`}
                          >
                            <img
                              src={thumbUrl}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />

                            {/* Badges */}
                            {isSelectedA && (
                              <div className="absolute inset-0 bg-cyan-950/60 flex flex-col items-center justify-center text-cyan-300 font-bold text-xs gap-1 backdrop-blur-[1px]">
                                <Check className="w-5 h-5 text-cyan-400" />
                                <span>الصورة A</span>
                              </div>
                            )}

                            {isSelectedB && (
                              <div className="absolute inset-0 bg-fuchsia-950/60 flex flex-col items-center justify-center text-fuchsia-300 font-bold text-xs gap-1 backdrop-blur-[1px]">
                                <Check className="w-5 h-5 text-fuchsia-400" />
                                <span>الصورة B</span>
                              </div>
                            )}

                            {!isSelectedA && !isSelectedB && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-semibold">
                                انقر للاختيار
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="sticky bottom-0 -mx-6 -mb-6 p-4 border-t border-surface-border bg-surface-100/90 backdrop-blur-xl flex items-center justify-between gap-4 flex-wrap shadow-2xl">
              <div className="flex items-center gap-3">
                {/* Slot A */}
                <div className={`flex items-center gap-2 p-1.5 px-3 rounded-xl border text-xs ${
                  selectedImageA ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-surface-50 border-surface-border text-slate-400'
                }`}>
                  <span className="font-bold">A:</span>
                  {selectedImageA ? (
                    <div className="flex items-center gap-2">
                      <img src={selectedImageA.thumbnailUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                      <span className="truncate max-w-[120px]">{selectedImageA.model || 'صورة A'}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedImageA(null); }} className="hover:text-rose-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span>لم يتم التحديد</span>
                  )}
                </div>

                {/* Slot B */}
                <div className={`flex items-center gap-2 p-1.5 px-3 rounded-xl border text-xs ${
                  selectedImageB ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300' : 'bg-surface-50 border-surface-border text-slate-400'
                }`}>
                  <span className="font-bold">B:</span>
                  {selectedImageB ? (
                    <div className="flex items-center gap-2">
                      <img src={selectedImageB.thumbnailUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                      <span className="truncate max-w-[120px]">{selectedImageB.model || 'صورة B'}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedImageB(null); }} className="hover:text-rose-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span>لم يتم التحديد</span>
                  )}
                </div>
              </div>

              {/* Start Compare Button */}
              <button
                disabled={!selectedImageA || !selectedImageB}
                onClick={() => setIsComparing(true)}
                className={`flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-2xl shadow-xl transition-all ${
                  selectedImageA && selectedImageB
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 text-white shadow-purple-500/25 active:scale-95 animate-pulse'
                    : 'bg-surface-50 text-slate-500 border border-surface-border cursor-not-allowed opacity-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>بدء المقارنة التفاعلية بالسلايدر</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
