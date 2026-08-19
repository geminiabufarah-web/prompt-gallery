import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import { isR2Configured } from '../lib/r2';
import { 
  X, 
  Settings, 
  Download, 
  Upload, 
  Database, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  FileJson,
  ShieldCheck,
  Sliders,
  Sparkles,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsModalOpen, 
    setIsSettingsModalOpen, 
    refreshData, 
    addToast,
    compressionSettings,
    updateCompressionSettings,
    resetCompressionSettings
  } = useApp();

  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const jsonString = await StorageService.exportAllData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prompt-gallery-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('تم تنزيل ملف النسخة الاحتياطية بنجاح 💾', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء تصدير البيانات', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const result = await StorageService.importData(text);
      await refreshData();
      addToast(`تم استيراد ${result.entriesCount} إدخال و ${result.collectionsCount} مجموعة بنجاح!`, 'success');
      setIsSettingsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'فشل استيراد الملف، تأكد من صحة التنسيق', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetCompression = () => {
    resetCompressionSettings();
    addToast('تمت استعادة إعدادات ضغط الصور الافتراضية (85% جودة، 2048px)', 'info');
  };

  // Quality assessment helper
  const qualityPercent = Math.round(compressionSettings.quality * 100);
  const getQualityBadgeInfo = (val: number) => {
    if (val >= 90) {
      return {
        label: 'جودة فائقة (دقة شبه أصلية - حجم متوسط)',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      };
    }
    if (val >= 75) {
      return {
        label: 'توازن مثالي (موصى به - جودة ممتازة وتوفير ~70% مساحة)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      };
    }
    if (val >= 55) {
      return {
        label: 'ضغط قوي (توفير ~85% مساحة - تحميل سريع جداً)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      };
    }
    return {
      label: 'أقصى ضغط (حجم فائق الصغر - جودة منخفضة)',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    };
  };

  const badgeInfo = getQualityBadgeInfo(qualityPercent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-2xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">الإعدادات العامة والضغط</h3>
              <p className="text-xs text-slate-400">إعدادات ضغط WebP، السحابة، والنسخ الاحتياطي</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Image Compression & Quality Slider Section */}
          <div className="p-5 rounded-2xl bg-surface-100/80 border border-purple-500/30 shadow-lg shadow-purple-500/5 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">نسبة ضغط وجودة تحويل الصور (WebP)</h4>
                  <p className="text-[11px] text-slate-400">يتم ضغط وتحويل كافة الصور في المتصفح قبل رفعها لتوفير المساحة والسرعة</p>
                </div>
              </div>

              <button
                onClick={handleResetCompression}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-50 border border-surface-border transition-colors flex items-center gap-1 text-[11px]"
                title="استعادة القيم الافتراضية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">استعادة الافتراضي</span>
              </button>
            </div>

            {/* Main Image Quality Slider */}
            <div className="space-y-2 pt-2 border-t border-surface-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>جودة الصورة الكاملة (Full Image Quality):</span>
                </label>
                <span className="text-sm font-bold font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30">
                  {qualityPercent}%
                </span>
              </div>

              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={qualityPercent}
                onChange={(e) => updateCompressionSettings({ quality: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-surface-50 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>30% (أقصى ضغط)</span>
                <span>85% (موصى به)</span>
                <span>100% (أعلى دقة)</span>
              </div>

              {/* Dynamic Assessment Tag */}
              <div className={`mt-2 px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${badgeInfo.color}`}>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{badgeInfo.label}</span>
              </div>
            </div>

            {/* Thumbnail Quality Slider */}
            <div className="space-y-2 pt-3 border-t border-surface-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  جودة الصور المصغرة (Thumbnail Quality):
                </label>
                <span className="text-xs font-bold font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                  {Math.round(compressionSettings.thumbnailQuality * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={Math.round(compressionSettings.thumbnailQuality * 100)}
                onChange={(e) => updateCompressionSettings({ thumbnailQuality: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-surface-50 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">تُستخدم لعرض البطاقات في المعرض وشاشات المقارنة لتسريع التمرير.</p>
            </div>

            {/* Max Resolution Options */}
            <div className="space-y-2 pt-3 border-t border-surface-border/60">
              <label className="text-xs font-semibold text-slate-300 block">
                الحد الأقصى لأبعاد الصورة (Max Resolution):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { val: 1920, label: '1080p (Full HD)', desc: 'توفير فائق' },
                  { val: 2048, label: '2K (QHD)', desc: 'موصى به ⭐' },
                  { val: 3840, label: '4K (Ultra HD)', desc: 'دقة فائقة' },
                  { val: 0, label: 'الأبعاد الأصلية', desc: 'بدون تصغير' },
                ].map((item) => {
                  const isSelected = compressionSettings.maxWidth === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => updateCompressionSettings({ maxWidth: item.val })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10 ring-1 ring-purple-500'
                          : 'bg-surface-50 border-surface-border text-slate-300 hover:text-white hover:bg-surface-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Cloud Connections Status Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 block">حالة الاتصال والخدمات:</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Supabase Status */}
              <div className="p-3.5 rounded-2xl bg-surface-100/70 border border-surface-border flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-200">قاعدة البيانات (Supabase)</h4>
                    {isSupabaseConfigured ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isSupabaseConfigured ? 'متصل بنجاح بالسحابة مع RLS' : 'يعمل بالنمط المحلي (Local Storage)'}
                  </p>
                </div>
              </div>

              {/* R2 Status */}
              <div className="p-3.5 rounded-2xl bg-surface-100/70 border border-surface-border flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isR2Configured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-200">تخزين الصور (Cloudflare R2)</h4>
                    {isR2Configured ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isR2Configured ? 'مستودع R2 مفعّل للصور' : 'تخزين الصور محلياً بالمتصفح'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore (JSON) */}
          <div className="p-4 rounded-2xl bg-surface-100/70 border border-surface-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <FileJson className="w-4 h-4 text-purple-400" />
              <span>النسخ الاحتياطي واستعادة البيانات (Backup & Restore)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يمكنك تصدير كافة البرومبتات والمجموعات والوسوم وحفظها في ملف JSON، أو استعادتها لاحقاً عند الانتقال لجهاز أو بيئة أخرى.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleExportJSON}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'جاري التصدير...' : 'تصدير كل البيانات (JSON)'}</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-surface-50 hover:bg-surface-200 border border-surface-border text-slate-200 hover:text-white cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{isImporting ? 'جاري الاستيراد...' : 'استيراد نسخة احتياطية'}</span>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>
            </div>
          </div>

          {/* User Account Details */}
          {user && (
            <div className="p-4 rounded-2xl bg-surface-100/70 border border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">حساب المستخدم النشط</span>
                  <span className="text-xs text-slate-400">{user.email || 'حساب محلي'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setIsSettingsModalOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
