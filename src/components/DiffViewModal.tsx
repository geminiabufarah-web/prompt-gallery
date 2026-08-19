import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, GitCompare, ArrowLeftRight, Copy, Check, Sparkles } from 'lucide-react';
import { diffWords } from 'diff';
import { Entry } from '../types';

export const DiffViewModal: React.FC = () => {
  const { isDiffModalOpen, closeDiffModal, diffEntries, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [swapped, setSwapped] = useState(false);

  if (!isDiffModalOpen || !diffEntries || diffEntries.length < 2) return null;

  const originalA = diffEntries[0];
  const originalB = diffEntries[1];

  const entryA = swapped ? originalB : originalA;
  const entryB = swapped ? originalA : originalB;

  const textA = activeTab === 'positive' ? entryA.prompt_positive : (entryA.prompt_negative || '');
  const textB = activeTab === 'positive' ? entryB.prompt_positive : (entryB.prompt_negative || '');

  // Calculate diff using `diffWords`
  const differences = diffWords(textA, textB);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`تم نسخ ${label}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-5xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                مقارنة الفروقات النصية بين النسخ (Diff View)
              </h3>
              <p className="text-xs text-slate-400">تتبع التغييرات والتعديلات الدقيقة في نصوص البرومبت</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSwapped(!swapped)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-300 hover:text-white transition-all"
              title="تبديل ترتيب النسخ"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تبديل الترتيب</span>
            </button>

            <button
              onClick={closeDiffModal}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Images Banner */}
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-surface-border bg-surface-300/40 shrink-0">
          {/* Side A */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-100/70 border border-surface-border">
            <img
              src={entryA.thumbnail_path || entryA.image_path}
              alt=""
              className="w-14 h-14 rounded-xl object-cover border border-surface-border shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-purple-400 block">
                {swapped ? 'النسخة المعدلة (B)' : 'النسخة الأصلية (A)'}
              </span>
              <p className="text-xs font-semibold text-slate-200 truncate">{entryA.model_name || 'نموذج غير محدد'}</p>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(entryA.created_at).toLocaleDateString('ar-EG')}
              </span>
            </div>
            <button
              onClick={() => handleCopyText(textA, 'البرومبت الأول')}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs flex items-center gap-1 border border-surface-border"
              title="نسخ النص"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Side B */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-100/70 border border-surface-border">
            <img
              src={entryB.thumbnail_path || entryB.image_path}
              alt=""
              className="w-14 h-14 rounded-xl object-cover border border-surface-border shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-emerald-400 block">
                {swapped ? 'النسخة الأصلية (A)' : 'النسخة المعدلة (B)'}
              </span>
              <p className="text-xs font-semibold text-slate-200 truncate">{entryB.model_name || 'نموذج غير محدد'}</p>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(entryB.created_at).toLocaleDateString('ar-EG')}
              </span>
            </div>
            <button
              onClick={() => handleCopyText(textB, 'البرومبت الثاني')}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs flex items-center gap-1 border border-surface-border"
              title="نسخ النص"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Selector (Positive vs Negative) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-surface-border bg-surface-100/30 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('positive')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'positive'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-surface-100 text-slate-400 hover:text-slate-200'
              }`}
            >
              البرومبت الإيجابي
            </button>
            {(entryA.prompt_negative || entryB.prompt_negative) && (
              <button
                onClick={() => setActiveTab('negative')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'negative'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-surface-100 text-slate-400 hover:text-slate-200'
                }`}
              >
                البرومبت السلبي
              </button>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500 inline-block" />
              <span className="text-emerald-300 font-medium">كلمات مُضافة (+ Add)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500 inline-block" />
              <span className="text-rose-300 font-medium">كلمات محذوفة (- Remove)</span>
            </div>
          </div>
        </div>

        {/* Scrollable Visual Diff Area */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          
          {/* Highlighted Visual Unified Diff */}
          <div className="p-5 rounded-2xl bg-surface-300/80 border border-surface-border shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>النتيجة المدمجة مع تمييز الفروقات:</span>
              </span>
            </div>
            <div className="text-sm font-mono leading-relaxed select-text p-4 rounded-xl bg-black/40 border border-white/5 whitespace-pre-wrap text-left" dir="ltr">
              {differences.map((part, index) => {
                if (part.added) {
                  return (
                    <span
                      key={index}
                      className="bg-emerald-500/25 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/40 mx-0.5"
                    >
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) {
                  return (
                    <span
                      key={index}
                      className="bg-rose-500/25 text-rose-300 line-through px-1.5 py-0.5 rounded border border-rose-500/40 mx-0.5 opacity-80"
                    >
                      {part.value}
                    </span>
                  );
                }
                return <span key={index} className="text-slate-200">{part.value}</span>;
              })}
            </div>
          </div>

          {/* Side-by-side Raw Views */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-surface-100/60 border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400">النص الأصلي (Original)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-300/80 text-xs font-mono text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-left" dir="ltr">
                {textA || <span className="text-slate-500">لا يوجد نص</span>}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-100/60 border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400">النص المعدّل (Modified)</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-300/80 text-xs font-mono text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-left" dir="ltr">
                {textB || <span className="text-slate-500">لا يوجد نص</span>}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
