-- ==============================================================================
-- Prompt Gallery — Supabase Database Schema & RLS Setup (With Multi-Image Support)
-- ==============================================================================

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

-- 3. Create entries table (Primary entry info)
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    parent_entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL,
    image_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    prompt_positive TEXT NOT NULL,
    prompt_negative TEXT,
    model_name TEXT,
    seed TEXT,
    steps INTEGER,
    cfg_scale NUMERIC,
    sampler TEXT,
    extra_params JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create entry_images table (Multi-Image Support per prompt entry)
CREATE TABLE IF NOT EXISTS public.entry_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create entry_tags junction table
CREATE TABLE IF NOT EXISTS public.entry_tags (
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, tag_id)
);

-- ==============================================================================
-- INDEXES for optimal search & filtering
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_collection_id ON public.entries(collection_id);
CREATE INDEX IF NOT EXISTS idx_entries_parent_entry_id ON public.entries(parent_entry_id);
CREATE INDEX IF NOT EXISTS idx_entries_is_favorite ON public.entries(is_favorite);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON public.entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entry_images_entry_id ON public.entry_images(entry_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);

-- Full Text Search Index for prompt text
CREATE INDEX IF NOT EXISTS idx_entries_prompt_fts ON public.entries USING gin(to_tsvector('english', prompt_positive || ' ' || COALESCE(prompt_negative, '') || ' ' || COALESCE(notes, '')));

-- ==============================================================================
-- TRIGGER FOR updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.entries;
CREATE TRIGGER trigger_set_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_tags ENABLE ROW LEVEL SECURITY;

-- Collections Policies
CREATE POLICY "Users can view own collections"
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);

-- Tags Policies
CREATE POLICY "Users can view own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

-- Entries Policies
CREATE POLICY "Users can view own entries"
    ON public.entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
    ON public.entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
    ON public.entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
    ON public.entries FOR DELETE
    USING (auth.uid() = user_id);

-- Entry Images Policies
CREATE POLICY "Users can view own entry_images"
    ON public.entry_images FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_images.entry_id AND entries.user_id = auth.uid()));

CREATE POLICY "Users can insert own entry_images"
    ON public.entry_images FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_images.entry_id AND entries.user_id = auth.uid()));

CREATE POLICY "Users can update own entry_images"
    ON public.entry_images FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_images.entry_id AND entries.user_id = auth.uid()));

CREATE POLICY "Users can delete own entry_images"
    ON public.entry_images FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_images.entry_id AND entries.user_id = auth.uid()));

-- Entry Tags Policies
CREATE POLICY "Users can view own entry_tags"
    ON public.entry_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_tags.entry_id AND entries.user_id = auth.uid()));

CREATE POLICY "Users can insert own entry_tags"
    ON public.entry_tags FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_tags.entry_id AND entries.user_id = auth.uid()));

CREATE POLICY "Users can delete own entry_tags"
    ON public.entry_tags FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_tags.entry_id AND entries.user_id = auth.uid()));
