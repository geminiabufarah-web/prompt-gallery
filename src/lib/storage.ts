import { Entry, Collection, Tag, EntryImage, ImageCompressionSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { createThumbnail, compressAndConvertToWebP, fileToDataUrl, getSavedCompressionSettings } from './imageUtils';

const LOCAL_STORAGE_ENTRIES_KEY = 'prompt_gallery_entries';
const LOCAL_STORAGE_COLLECTIONS_KEY = 'prompt_gallery_collections';
const LOCAL_STORAGE_TAGS_KEY = 'prompt_gallery_tags';

// Initial sample data for instantaneous testing
const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'شخصيات وخيال علمي',
    description: 'شخصيات سيبربانك، أبطال خوارق، ومحاربي المستقبل',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'col-2',
    name: 'مناظر طبيعية وسريالية',
    description: 'كواكب فضائية، بيئات ساحرة وطبيعة خلابة',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'col-3',
    name: 'تصميم ثلاثي الأبعاد وIsometric',
    description: 'غرف مصغرة وأيقونات ثلاثية الأبعاد بأسلوب كرتوني',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Cyberpunk', created_at: new Date().toISOString() },
  { id: 'tag-2', name: 'Cinematic', created_at: new Date().toISOString() },
  { id: 'tag-3', name: '8k', created_at: new Date().toISOString() },
  { id: 'tag-4', name: 'Octane Render', created_at: new Date().toISOString() },
  { id: 'tag-5', name: 'Surrealism', created_at: new Date().toISOString() },
  { id: 'tag-6', name: 'Isometric', created_at: new Date().toISOString() },
  { id: 'tag-7', name: 'Unreal Engine 5', created_at: new Date().toISOString() },
];

const DEFAULT_ENTRIES: Entry[] = [
  {
    id: 'entry-1',
    collection_id: 'col-1',
    parent_entry_id: null,
    image_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    thumbnail_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
    images: [
      {
        id: 'img-1-1',
        image_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        thumbnail_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
        is_primary: true,
      },
      {
        id: 'img-1-2',
        image_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
        thumbnail_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=500&q=80',
        is_primary: false,
      }
    ],
    prompt_positive: 'A futuristic cybernetic cyborg warrior with glowing neon blue visor, standing in a rainy Tokyo street at night, reflective wet asphalt, cinematic lighting, 8k resolution, photorealistic, octane render, sharp focus',
    prompt_negative: 'blurry, low quality, distorted anatomy, extra limbs, bad hands, noisy, watermark',
    model_name: 'Midjourney v6',
    seed: '428910482',
    steps: 30,
    cfg_scale: 7.5,
    sampler: 'DPM++ 2M Karras',
    notes: 'النسخة الأصلية للشخصية',
    is_favorite: true,
    rating: 5,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    tags: [DEFAULT_TAGS[0], DEFAULT_TAGS[1], DEFAULT_TAGS[2], DEFAULT_TAGS[3]],
  }
];

export class StorageService {
  // --- Collections ---
  static async getCollections(): Promise<Collection[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      // If user is not logged in, return empty (zero collections)
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('collections')
        .select('*, entries(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getCollections error:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,
        created_at: item.created_at,
        entry_count: item.entries?.[0]?.count || 0,
      }));
    }
    return [];
  }

  static getLocalCollections(): Collection[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_COLLECTIONS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_COLLECTIONS_KEY, JSON.stringify(DEFAULT_COLLECTIONS));
      return DEFAULT_COLLECTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  }

  static async createCollection(name: string, description?: string): Promise<Collection> {
    const trimmed = name.trim();
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if collection already exists
      let query = supabase.from('collections').select('*').ilike('name', trimmed);
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }
      const { data: existingCol } = await query.maybeSingle();
      if (existingCol) return existingCol;

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user?.id,
          name: trimmed,
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          const { data: fallbackCol } = await supabase
            .from('collections')
            .select('*')
            .ilike('name', trimmed)
            .maybeSingle();
          if (fallbackCol) return fallbackCol;
        }
        throw error;
      }
      return data;
    }

    const collections = this.getLocalCollections();
    const existing = collections.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCol: Collection = {
      id: 'col-' + Date.now(),
      name: trimmed,
      description,
      created_at: new Date().toISOString(),
    };
    collections.unshift(newCol);
    localStorage.setItem(LOCAL_STORAGE_COLLECTIONS_KEY, JSON.stringify(collections));
    return newCol;
  }

  static async updateCollection(id: string, name: string, description?: string): Promise<Collection> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('collections')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const collections = this.getLocalCollections().map(c => 
      c.id === id ? { ...c, name, description } : c
    );
    localStorage.setItem(LOCAL_STORAGE_COLLECTIONS_KEY, JSON.stringify(collections));
    const updated = collections.find(c => c.id === id);
    if (!updated) throw new Error('Collection not found');
    return updated;
  }

  static async deleteCollection(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('collections').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const collections = this.getLocalCollections().filter(c => c.id !== id);
    localStorage.setItem(LOCAL_STORAGE_COLLECTIONS_KEY, JSON.stringify(collections));
  }

  // --- Tags ---
  static async getTags(): Promise<Tag[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      // If user is not logged in, return empty
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase getTags error:', error);
        return [];
      }
      return data || [];
    }
    return [];
  }

  static getLocalTags(): Tag[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_TAGS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_TAGS_KEY, JSON.stringify(DEFAULT_TAGS));
      return DEFAULT_TAGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TAGS;
    }
  }

  static async createTag(name: string): Promise<Tag> {
    const trimmed = name.trim().replace(/^#/, '');
    if (!trimmed) throw new Error('Tag name cannot be empty');

    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if tag already exists for this user (or globally)
      let query = supabase.from('tags').select('*').ilike('name', trimmed);
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }
      const { data: existingTag } = await query.maybeSingle();

      if (existingTag) {
        return existingTag;
      }

      // Try inserting the new tag
      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user?.id,
          name: trimmed,
        })
        .select()
        .single();

      if (error) {
        // Handle race condition or duplicate key conflict gracefully
        if (error.code === '23505') {
          const { data: fallbackTag } = await supabase
            .from('tags')
            .select('*')
            .ilike('name', trimmed)
            .maybeSingle();
          if (fallbackTag) return fallbackTag;
        }
        throw error;
      }
      return data;
    }

    const tags = this.getLocalTags();
    const existing = tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newTag: Tag = {
      id: 'tag-' + Date.now(),
      name: trimmed,
      created_at: new Date().toISOString(),
    };
    tags.push(newTag);
    localStorage.setItem(LOCAL_STORAGE_TAGS_KEY, JSON.stringify(tags));
    return newTag;
  }

  // --- Entries ---
  static async getEntries(): Promise<Entry[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      // If user is not logged in, return empty (strictly zero entries)
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('entries')
        .select(`
          *,
          collection:collections(*),
          entry_images(*),
          entry_tags (
            tag:tags(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getEntries error:', error);
        return [];
      }

      const entries: Entry[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        collection_id: row.collection_id,
        parent_entry_id: row.parent_entry_id,
        image_path: row.image_path,
        thumbnail_path: row.thumbnail_path,
        images: (row.entry_images && row.entry_images.length > 0)
          ? row.entry_images
          : [{ id: 'img-main', image_path: row.image_path, thumbnail_path: row.thumbnail_path, is_primary: true }],
        prompt_positive: row.prompt_positive,
        prompt_negative: row.prompt_negative,
        model_name: row.model_name,
        seed: row.seed,
        steps: row.steps,
        cfg_scale: row.cfg_scale,
        sampler: row.sampler,
        extra_params: row.extra_params,
        notes: row.notes,
        is_favorite: row.is_favorite,
        rating: row.rating,
        created_at: row.created_at,
        updated_at: row.updated_at,
        collection: row.collection,
        tags: row.entry_tags ? row.entry_tags.map((et: any) => et.tag).filter(Boolean) : [],
      }));

      return this.populateEntryHierarchy(entries);
    }

    return this.populateEntryHierarchy(this.getLocalEntries());
  }

  static getLocalEntries(): Entry[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_ENTRIES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(DEFAULT_ENTRIES));
      return DEFAULT_ENTRIES;
    }
    try {
      const parsed = JSON.parse(raw);
      return parsed.map((e: Entry) => ({
        ...e,
        images: e.images && e.images.length > 0
          ? e.images
          : [{ id: 'img-' + e.id, image_path: e.image_path, thumbnail_path: e.thumbnail_path, is_primary: true }]
      }));
    } catch {
      return DEFAULT_ENTRIES;
    }
  }

  private static populateEntryHierarchy(entries: Entry[]): Entry[] {
    const entryMap = new Map<string, Entry>();
    entries.forEach(e => {
      entryMap.set(e.id, { ...e, children: [] });
    });

    const populated: Entry[] = [];

    entries.forEach(e => {
      const current = entryMap.get(e.id)!;
      if (e.parent_entry_id && entryMap.has(e.parent_entry_id)) {
        const parent = entryMap.get(e.parent_entry_id)!;
        current.parent = parent;
        parent.children = parent.children || [];
        parent.children.push(current);
      }
      populated.push(current);
    });

    return populated;
  }

  // --- Image Upload to Supabase Storage (Optimized WebP, Free Tier friendly) ---
  static async uploadSingleImageFile(
    file: File,
    userId: string = 'user',
    entryId: string = Date.now().toString(),
    index: number = 0,
    compressionSettings?: ImageCompressionSettings
  ): Promise<{ imagePath: string; thumbnailPath: string }> {
    const config = compressionSettings || getSavedCompressionSettings();
    const quality = typeof config.quality === 'number' ? config.quality : 0.85;
    const maxWidth = typeof config.maxWidth === 'number' ? config.maxWidth : 2048;
    const thumbQuality = typeof config.thumbnailQuality === 'number' ? config.thumbnailQuality : 0.80;

    // Generate both Full WebP (custom max dimension & quality) and Thumbnail WebP concurrently client-side
    let fullWebp: { blob: Blob; dataUrl: string };
    let thumbWebp: { blob: Blob; dataUrl: string };

    try {
      [fullWebp, thumbWebp] = await Promise.all([
        compressAndConvertToWebP(file, maxWidth, maxWidth, quality),
        createThumbnail(file, 400, 400, thumbQuality),
      ]);
    } catch (conversionErr) {
      console.warn('WebP compression failed, falling back to raw file:', conversionErr);
      const rawDataUrl = await fileToDataUrl(file);
      const thumb = await createThumbnail(file, 400, 400, thumbQuality).catch(() => ({ blob: file, dataUrl: rawDataUrl }));
      fullWebp = { blob: file, dataUrl: rawDataUrl };
      thumbWebp = thumb;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const fullPath = `${userId}/${entryId}/full_${index}_${Date.now()}.webp`;
        const thumbPath = `${userId}/${entryId}/thumb_${index}_${Date.now()}.webp`;

        // Upload Full WebP
        const { error: origErr } = await supabase.storage
          .from('prompt-images')
          .upload(fullPath, fullWebp.blob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (origErr) console.warn('Supabase storage full image upload error:', origErr);

        // Upload Thumbnail WebP
        const { error: thumbErr } = await supabase.storage
          .from('prompt-images')
          .upload(thumbPath, thumbWebp.blob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (thumbErr) console.warn('Supabase storage thumb upload error:', thumbErr);

        if (!origErr) {
          const { data: origUrlData } = supabase.storage.from('prompt-images').getPublicUrl(fullPath);
          const { data: thumbUrlData } = supabase.storage.from('prompt-images').getPublicUrl(thumbPath);

          return {
            imagePath: origUrlData.publicUrl,
            thumbnailPath: thumbErr ? origUrlData.publicUrl : thumbUrlData.publicUrl,
          };
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, using fallback WebP dataUrls:', err);
      }
    }

    // Fallback if offline or Supabase not configured: return client-side compressed WebP Data URLs
    return {
      imagePath: fullWebp.dataUrl,
      thumbnailPath: thumbWebp.dataUrl,
    };
  }

  static async createEntry(
    entryData: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'children' | 'parent'>,
    tagIds: string[] = []
  ): Promise<Entry> {
    const primaryImage = entryData.images?.find(img => img.is_primary) || entryData.images?.[0] || {
      id: 'img-default',
      image_path: entryData.image_path,
      thumbnail_path: entryData.thumbnail_path,
      is_primary: true
    };

    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const newId = crypto.randomUUID();

      const { data: insertedEntry, error: entryError } = await supabase
        .from('entries')
        .insert({
          id: newId,
          user_id: user?.id,
          collection_id: entryData.collection_id || null,
          parent_entry_id: entryData.parent_entry_id || null,
          image_path: primaryImage.image_path,
          thumbnail_path: primaryImage.thumbnail_path,
          prompt_positive: entryData.prompt_positive,
          prompt_negative: entryData.prompt_negative || null,
          model_name: entryData.model_name || null,
          seed: entryData.seed || null,
          steps: entryData.steps || null,
          cfg_scale: entryData.cfg_scale || null,
          sampler: entryData.sampler || null,
          extra_params: entryData.extra_params || {},
          notes: entryData.notes || null,
          is_favorite: entryData.is_favorite || false,
          rating: entryData.rating || null,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Insert all images into entry_images
      if (entryData.images && entryData.images.length > 0) {
        const imagesToInsert = entryData.images.map((img, i) => ({
          entry_id: newId,
          image_path: img.image_path,
          thumbnail_path: img.thumbnail_path,
          is_primary: img.is_primary ?? (i === 0),
        }));
        await supabase.from('entry_images').insert(imagesToInsert);
      }

      // Link tags
      const uniqueTagIds = Array.from(new Set(tagIds));
      if (uniqueTagIds.length > 0) {
        const entryTagsToInsert = uniqueTagIds.map(tagId => ({
          entry_id: newId,
          tag_id: tagId,
        }));
        await supabase.from('entry_tags').insert(entryTagsToInsert);
      }

      return insertedEntry;
    }

    // Local mode
    const allTags = this.getLocalTags();
    const attachedTags = allTags.filter(t => tagIds.includes(t.id));
    const collections = this.getLocalCollections();
    const collection = collections.find(c => c.id === entryData.collection_id) || null;

    const newEntry: Entry = {
      ...entryData,
      id: 'entry-' + Date.now(),
      image_path: primaryImage.image_path,
      thumbnail_path: primaryImage.thumbnail_path,
      images: entryData.images || [primaryImage],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: attachedTags,
      collection,
    };

    const entries = this.getLocalEntries();
    entries.unshift(newEntry);
    localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(entries));
    return newEntry;
  }

  static async updateEntry(
    id: string,
    updates: Partial<Entry>,
    tagIds?: string[]
  ): Promise<Entry> {
    const primaryImage = updates.images?.find(img => img.is_primary) || updates.images?.[0];

    if (isSupabaseConfigured && supabase) {
      const { tags, children, parent, collection, images, ...fieldsToUpdate } = updates;
      
      if (primaryImage) {
        fieldsToUpdate.image_path = primaryImage.image_path;
        fieldsToUpdate.thumbnail_path = primaryImage.thumbnail_path;
      }

      const { data, error } = await supabase
        .from('entries')
        .update(fieldsToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (images) {
        await supabase.from('entry_images').delete().eq('entry_id', id);
        if (images.length > 0) {
          const imagesToInsert = images.map((img, i) => ({
            entry_id: id,
            image_path: img.image_path,
            thumbnail_path: img.thumbnail_path,
            is_primary: img.is_primary ?? (i === 0),
          }));
          await supabase.from('entry_images').insert(imagesToInsert);
        }
      }

      if (tagIds) {
        await supabase.from('entry_tags').delete().eq('entry_id', id);
        const uniqueTagIds = Array.from(new Set(tagIds));
        if (uniqueTagIds.length > 0) {
          const entryTagsToInsert = uniqueTagIds.map(tagId => ({
            entry_id: id,
            tag_id: tagId,
          }));
          await supabase.from('entry_tags').insert(entryTagsToInsert);
        }
      }

      return data;
    }

    const entries = this.getLocalEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Entry not found');

    let attachedTags = entries[index].tags || [];
    if (tagIds) {
      const allTags = this.getLocalTags();
      attachedTags = allTags.filter(t => tagIds.includes(t.id));
    }

    const collections = this.getLocalCollections();
    const collection = updates.collection_id !== undefined
      ? collections.find(c => c.id === updates.collection_id) || null
      : entries[index].collection;

    const finalImages = updates.images || entries[index].images || [
      { id: 'img-1', image_path: entries[index].image_path, thumbnail_path: entries[index].thumbnail_path, is_primary: true }
    ];

    const currentPrimary = finalImages.find(img => img.is_primary) || finalImages[0];

    const updatedEntry: Entry = {
      ...entries[index],
      ...updates,
      images: finalImages,
      image_path: currentPrimary.image_path,
      thumbnail_path: currentPrimary.thumbnail_path,
      tags: attachedTags,
      collection,
      updated_at: new Date().toISOString(),
    };

    entries[index] = updatedEntry;
    localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(entries));
    return updatedEntry;
  }

  static async deleteEntry(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const entries = this.getLocalEntries().filter(e => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(entries));
  }

  /**
   * Merges a source duplicate entry into a target primary entry:
   * transfers all unique images from source to target, updates target, and deletes source entry.
   */
  static async mergeEntries(targetEntryId: string, sourceEntryId: string): Promise<Entry> {
    const entries = await this.getEntries();
    const target = entries.find(e => e.id === targetEntryId);
    const source = entries.find(e => e.id === sourceEntryId);

    if (!target || !source) {
      throw new Error('تعذر العثور على أحد الإدخالات المراد دمجها');
    }

    const targetImages: EntryImage[] = (target.images && target.images.length > 0)
      ? [...target.images]
      : [{ id: `img-t-${Date.now()}`, image_path: target.image_path, thumbnail_path: target.thumbnail_path, is_primary: true }];

    const sourceImages: EntryImage[] = (source.images && source.images.length > 0)
      ? source.images
      : [{ id: `img-s-${Date.now()}`, image_path: source.image_path, thumbnail_path: source.thumbnail_path, is_primary: false }];

    // Avoid adding duplicate image URLs
    const existingPaths = new Set(targetImages.map(img => img.image_path));
    const newImagesToAdd: EntryImage[] = [];

    sourceImages.forEach((img, i) => {
      if (!existingPaths.has(img.image_path)) {
        newImagesToAdd.push({
          id: `img-merged-${Date.now()}-${i}`,
          image_path: img.image_path,
          thumbnail_path: img.thumbnail_path,
          is_primary: false,
        });
        existingPaths.add(img.image_path);
      }
    });

    const combinedImages = [...targetImages, ...newImagesToAdd];

    // Update target entry with the merged images
    const updatedTarget = await this.updateEntry(targetEntryId, {
      images: combinedImages,
    });

    // Delete the source duplicate entry
    await this.deleteEntry(sourceEntryId);

    return updatedTarget;
  }

  static async toggleFavorite(id: string, currentStatus: boolean): Promise<boolean> {
    const newStatus = !currentStatus;
    await this.updateEntry(id, { is_favorite: newStatus });
    return newStatus;
  }

  // --- Export & Import ---
  static async exportAllData(): Promise<string> {
    const [entries, collections, tags] = await Promise.all([
      this.getEntries(),
      this.getCollections(),
      this.getTags(),
    ]);

    const exportObject = {
      version: '1.2.0',
      exported_at: new Date().toISOString(),
      collections,
      tags,
      entries,
    };

    return JSON.stringify(exportObject, null, 2);
  }

  static async importData(jsonString: string): Promise<{ entriesCount: number; collectionsCount: number; tagsCount: number }> {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      throw new Error('الملف غير صالح أو التنسيق غير مدعوم');
    }

    const importedCollections = Array.isArray(data.collections) ? data.collections : [];
    const importedTags = Array.isArray(data.tags) ? data.tags : [];
    const importedEntries = Array.isArray(data.entries) ? data.entries : [];

    localStorage.setItem(LOCAL_STORAGE_COLLECTIONS_KEY, JSON.stringify(importedCollections));
    localStorage.setItem(LOCAL_STORAGE_TAGS_KEY, JSON.stringify(importedTags));
    localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(importedEntries));

    return {
      collectionsCount: importedCollections.length,
      tagsCount: importedTags.length,
      entriesCount: importedEntries.length,
    };
  }
}
