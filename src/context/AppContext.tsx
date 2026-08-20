import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Entry, Collection, Tag, FilterState, ImageCompressionSettings } from '../types';
import { StorageService } from '../lib/storage';
import { getSavedCompressionSettings, saveCompressionSettings, DEFAULT_COMPRESSION_SETTINGS } from '../lib/imageUtils';
import { useAuth } from './AuthContext';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  entries: Entry[];
  collections: Collection[];
  tags: Tag[];
  isLoading: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredEntries: Entry[];

  // Image compression settings
  compressionSettings: ImageCompressionSettings;
  updateCompressionSettings: (settings: Partial<ImageCompressionSettings>) => void;
  resetCompressionSettings: () => void;

  // Modal States
  selectedEntryForDetails: Entry | null;
  setSelectedEntryForDetails: (entry: Entry | null) => void;

  isEntryFormOpen: boolean;
  openEntryForm: (entryToEdit?: Entry | null, parentEntry?: Entry | null) => void;
  closeEntryForm: () => void;
  entryToEdit: Entry | null;
  parentEntryForNew: Entry | null;

  isDiffModalOpen: boolean;
  openDiffModal: (entryA: Entry, entryB: Entry) => void;
  closeDiffModal: () => void;
  diffEntries: [Entry, Entry] | null;

  isCompareModalOpen: boolean;
  openCompareModal: () => void;
  closeCompareModal: () => void;
  isCompareSelectMode: boolean;
  toggleCompareSelectMode: () => void;
  compareSelectedEntryIds: string[];
  toggleCompareEntrySelect: (entryId: string) => void;
  clearCompareSelection: () => void;

  isCollectionsModalOpen: boolean;
  setIsCollectionsModalOpen: (open: boolean) => void;

  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;

  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  isImageSplitModalOpen: boolean;
  openImageSplitModal: (initialA?: { url: string; prompt: string; model?: string } | null, initialB?: { url: string; prompt: string; model?: string } | null) => void;
  closeImageSplitModal: () => void;
  splitModalInitialImages: [{ url: string; prompt: string; model?: string } | null, { url: string; prompt: string; model?: string } | null] | null;

  // Actions
  refreshData: () => Promise<void>;
  toggleFavorite: (entryId: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  mergeEntries: (targetEntryId: string, sourceEntryId: string) => Promise<void>;
  
  // Toast notifications
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  selectedCollectionId: null,
  selectedTagIds: [],
  selectedModel: null,
  onlyFavorites: false,
  dateRange: { from: null, to: null },
  gridSize: 'medium',
  sortBy: 'newest',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Image compression settings
  const [compressionSettings, setCompressionSettings] = useState<ImageCompressionSettings>(() => getSavedCompressionSettings());

  const updateCompressionSettings = useCallback((newSettings: Partial<ImageCompressionSettings>) => {
    setCompressionSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveCompressionSettings(updated);
      return updated;
    });
  }, []);

  const resetCompressionSettings = useCallback(() => {
    setCompressionSettings(DEFAULT_COMPRESSION_SETTINGS);
    saveCompressionSettings(DEFAULT_COMPRESSION_SETTINGS);
  }, []);

  // Modals state
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<Entry | null>(null);
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
  const [parentEntryForNew, setParentEntryForNew] = useState<Entry | null>(null);

  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffEntries, setDiffEntries] = useState<[Entry, Entry] | null>(null);

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCompareSelectMode, setIsCompareSelectMode] = useState(false);
  const [compareSelectedEntryIds, setCompareSelectedEntryIds] = useState<string[]>([]);

  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isImageSplitModalOpen, setIsImageSplitModalOpen] = useState(false);
  const [splitModalInitialImages, setSplitModalInitialImages] = useState<[{ url: string; prompt: string; model?: string } | null, { url: string; prompt: string; model?: string } | null] | null>(null);

  const openImageSplitModal = useCallback((initialA?: { url: string; prompt: string; model?: string } | null, initialB?: { url: string; prompt: string; model?: string } | null) => {
    setSplitModalInitialImages([initialA || null, initialB || null]);
    setIsImageSplitModalOpen(true);
  }, []);

  const closeImageSplitModal = useCallback(() => {
    setIsImageSplitModalOpen(false);
    setSplitModalInitialImages(null);
  }, []);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedEntries, fetchedCollections, fetchedTags] = await Promise.all([
        StorageService.getEntries(),
        StorageService.getCollections(),
        StorageService.getTags(),
      ]);
      setEntries(fetchedEntries);
      setCollections(fetchedCollections);
      setTags(fetchedTags);

      // Keep selected entry in sync if it's currently open
      if (selectedEntryForDetails) {
        const updatedSelected = fetchedEntries.find(e => e.id === selectedEntryForDetails.id);
        if (updatedSelected) {
          setSelectedEntryForDetails(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      addToast('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, selectedEntryForDetails]);

  useEffect(() => {
    refreshData();
  }, [user?.id, refreshData]);

  // Form helper
  const openEntryForm = (toEdit?: Entry | null, parent?: Entry | null) => {
    setEntryToEdit(toEdit || null);
    setParentEntryForNew(parent || null);
    setIsEntryFormOpen(true);
  };

  const closeEntryForm = () => {
    setIsEntryFormOpen(false);
    setEntryToEdit(null);
    setParentEntryForNew(null);
  };

  // Diff helper
  const openDiffModal = (entryA: Entry, entryB: Entry) => {
    setDiffEntries([entryA, entryB]);
    setIsDiffModalOpen(true);
  };

  const closeDiffModal = () => {
    setIsDiffModalOpen(false);
    setDiffEntries(null);
  };

  // Compare helper
  const toggleCompareSelectMode = () => {
    if (isCompareSelectMode) {
      setIsCompareSelectMode(false);
      setCompareSelectedEntryIds([]);
    } else {
      setIsCompareSelectMode(true);
    }
  };

  const toggleCompareEntrySelect = (entryId: string) => {
    setCompareSelectedEntryIds(prev =>
      prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]
    );
  };

  const clearCompareSelection = () => {
    setCompareSelectedEntryIds([]);
  };

  const openCompareModal = () => {
    if (compareSelectedEntryIds.length < 2) {
      addToast('يرجى تحديد إدخالين على الأقل للمقارنة', 'info');
      return;
    }
    setIsCompareModalOpen(true);
  };

  const closeCompareModal = () => {
    setIsCompareModalOpen(false);
  };

  const toggleFavorite = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      const newStatus = await StorageService.toggleFavorite(entryId, entry.is_favorite);
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, is_favorite: newStatus } : e));
      if (selectedEntryForDetails?.id === entryId) {
        setSelectedEntryForDetails(prev => prev ? { ...prev, is_favorite: newStatus } : null);
      }
      addToast(newStatus ? 'تمت الإضافة إلى المفضلة ⭐' : 'تمت الإزالة من المفضلة', 'info');
    } catch (err) {
      console.error(err);
      addToast('تعذر تغيير حالة المفضلة', 'error');
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      await StorageService.deleteEntry(entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
      if (selectedEntryForDetails?.id === entryId) {
        setSelectedEntryForDetails(null);
      }
      addToast('تم حذف الإدخال بنجاح', 'success');
    } catch (err) {
      console.error(err);
      addToast('تعذر حذف الإدخال', 'error');
    }
  };

  const mergeEntries = async (targetEntryId: string, sourceEntryId: string) => {
    try {
      const updated = await StorageService.mergeEntries(targetEntryId, sourceEntryId);
      setEntries(prev => prev.filter(e => e.id !== sourceEntryId).map(e => e.id === targetEntryId ? updated : e));
      if (selectedEntryForDetails?.id === sourceEntryId) {
        setSelectedEntryForDetails(null);
      } else if (selectedEntryForDetails?.id === targetEntryId) {
        setSelectedEntryForDetails(updated);
      }
      addToast('تم نقل الصور بنجاح وحذف البرومبت المكرر 🚀', 'success');
    } catch (err: any) {
      console.error('Merge error:', err);
      addToast(err.message || 'تعذر دمج البرومبتات', 'error');
      throw err;
    }
  };

  const resetFilters = () => {
    setFilters({ ...defaultFilters, gridSize: filters.gridSize });
  };

  // Filtered & Sorted entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search query (checks positive prompt, negative prompt, notes, model)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesPositive = entry.prompt_positive.toLowerCase().includes(q);
        const matchesNegative = entry.prompt_negative?.toLowerCase().includes(q) ?? false;
        const matchesNotes = entry.notes?.toLowerCase().includes(q) ?? false;
        const matchesModel = entry.model_name?.toLowerCase().includes(q) ?? false;
        const matchesTag = entry.tags?.some(t => t.name.toLowerCase().includes(q)) ?? false;
        if (!matchesPositive && !matchesNegative && !matchesNotes && !matchesModel && !matchesTag) {
          return false;
        }
      }

      // Collection filter
      if (filters.selectedCollectionId && entry.collection_id !== filters.selectedCollectionId) {
        return false;
      }

      // Tag filter (must match all selected tags or any)
      if (filters.selectedTagIds.length > 0) {
        const entryTagIds = entry.tags?.map(t => t.id) || [];
        const hasAllTags = filters.selectedTagIds.every(tId => entryTagIds.includes(tId));
        if (!hasAllTags) return false;
      }

      // Model filter
      if (filters.selectedModel && entry.model_name !== filters.selectedModel) {
        return false;
      }

      // Favorites filter
      if (filters.onlyFavorites && !entry.is_favorite) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.from) {
        const fromDate = new Date(filters.dateRange.from).getTime();
        const entryDate = new Date(entry.created_at).getTime();
        if (entryDate < fromDate) return false;
      }
      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to).getTime() + 86400000; // End of selected day
        const entryDate = new Date(entry.created_at).getTime();
        if (entryDate > toDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (filters.sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (filters.sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (filters.sortBy === 'prompt') {
        return a.prompt_positive.localeCompare(b.prompt_positive);
      }
      return 0;
    });
  }, [entries, filters]);

  return (
    <AppContext.Provider
      value={{
        entries,
        collections,
        tags,
        isLoading,
        filters,
        setFilters,
        resetFilters,
        filteredEntries,
        compressionSettings,
        updateCompressionSettings,
        resetCompressionSettings,
        selectedEntryForDetails,
        setSelectedEntryForDetails,
        isEntryFormOpen,
        openEntryForm,
        closeEntryForm,
        entryToEdit,
        parentEntryForNew,
        isDiffModalOpen,
        openDiffModal,
        closeDiffModal,
        diffEntries,
        isCompareModalOpen,
        openCompareModal,
        closeCompareModal,
        isCompareSelectMode,
        toggleCompareSelectMode,
        compareSelectedEntryIds,
        toggleCompareEntrySelect,
        clearCompareSelection,
        isCollectionsModalOpen,
        setIsCollectionsModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isImageSplitModalOpen,
        openImageSplitModal,
        closeImageSplitModal,
        splitModalInitialImages,
        refreshData,
        toggleFavorite,
        deleteEntry,
        mergeEntries,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
