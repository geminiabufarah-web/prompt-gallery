import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../lib/storage';
import { X, FolderOpen, Plus, Edit2, Trash2, Check, Folder } from 'lucide-react';

export const CollectionsModal: React.FC = () => {
  const { 
    isCollectionsModalOpen, 
    setIsCollectionsModalOpen, 
    collections, 
    entries, 
    refreshData, 
    addToast 
  } = useApp();

  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCollectionsModalOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      setIsSubmitting(true);
      await StorageService.createCollection(newColName.trim(), newColDesc.trim() || undefined);
      setNewColName('');
      setNewColDesc('');
      await refreshData();
      addToast('تم إنشاء المجموعة بنجاح 📁', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء إنشاء المجموعة', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (col: any) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditDesc(col.description || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      setIsSubmitting(true);
      await StorageService.updateCollection(id, editName.trim(), editDesc.trim() || undefined);
      setEditingId(null);
      await refreshData();
      addToast('تم حفظ التعديلات', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء تعديل المجموعة', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const count = entries.filter(e => e.collection_id === id).length;
    if (!window.confirm(`هل أنت متأكد من حذف المجموعة "${name}"؟ ${count > 0 ? `(تحتوي على ${count} صور)` : ''}`)) {
      return;
    }

    try {
      await StorageService.deleteCollection(id);
      await refreshData();
      addToast('تم حذف المجموعة', 'success');
    } catch (err) {
      console.error(err);
      addToast('تعذر حذف المجموعة', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-2xl bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">إدارة المجموعات والمشاريع</h3>
              <p className="text-xs text-slate-400">تنظيم البرومبتات ضمن تصنيفات ومشاريع منفصلة</p>
            </div>
          </div>

          <button
            onClick={() => setIsCollectionsModalOpen(false)}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Create New Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-surface-100/80 border border-surface-border space-y-3">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>إضافة مجموعة جديدة</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="اسم المجموعة (مثال: شخصيات، خيال علمي)..."
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="الوصف (اختياري)..."
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                className="bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newColName.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
              >
                إنشاء المجموعة
              </button>
            </div>
          </form>

          {/* Collections List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block mb-2">المجموعات الحالية ({collections.length}):</span>
            
            {collections.map(col => {
              const count = entries.filter(e => e.collection_id === col.id).length;
              const isEditing = editingId === col.id;

              return (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-100/60 border border-surface-border hover:border-surface-border/80 transition-all"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-surface-200 border border-amber-500 rounded-lg px-2.5 py-1 text-xs text-slate-100 flex-1"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="الوصف..."
                        className="bg-surface-200 border border-surface-border rounded-lg px-2.5 py-1 text-xs text-slate-300 flex-1"
                      />
                      <button
                        onClick={() => handleSaveEdit(col.id)}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>حفظ</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{col.name}</h4>
                          <span className="text-[10px] text-slate-400 bg-surface-200 px-2 py-0.5 rounded-full">
                            {count} {count === 1 ? 'صورة' : 'صور'}
                          </span>
                        </div>
                        {col.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{col.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0 mr-2">
                      <button
                        onClick={() => handleStartEdit(col)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-50 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id, col.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
