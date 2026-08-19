export interface EntryImage {
  id: string;
  entry_id?: string;
  image_path: string;
  thumbnail_path: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface Collection {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  created_at: string;
  entry_count?: number;
}

export interface Tag {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
}

export interface Entry {
  id: string;
  user_id?: string;
  collection_id?: string | null;
  parent_entry_id?: string | null;
  image_path: string;
  thumbnail_path: string;
  images?: EntryImage[]; // Multi-image support
  prompt_positive: string;
  prompt_negative?: string | null;
  model_name?: string | null;
  seed?: string | null;
  steps?: number | null;
  cfg_scale?: number | null;
  sampler?: string | null;
  extra_params?: Record<string, any>;
  notes?: string | null;
  is_favorite: boolean;
  rating?: number | null;
  created_at: string;
  updated_at: string;
  // Joined or populated fields
  tags?: Tag[];
  children?: Entry[];
  parent?: Entry | null;
  collection?: Collection | null;
}

export interface FilterState {
  searchQuery: string;
  selectedCollectionId: string | null;
  selectedTagIds: string[];
  selectedModel: string | null;
  onlyFavorites: boolean;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  gridSize: 'small' | 'medium' | 'large';
  sortBy: 'newest' | 'oldest' | 'rating' | 'prompt';
}

export interface PromptSimilarityResult {
  entry: Entry;
  similarityPercentage: number;
}

export interface ImageCompressionSettings {
  quality: number; // 0.3 to 1.0 (e.g. 0.85 = 85%)
  maxWidth: number; // 1920, 2048, 3840, or 0 (original)
  thumbnailQuality: number; // 0.3 to 1.0 (e.g. 0.80 = 80%)
}

