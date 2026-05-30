-- Migration to support Workers Portal
-- Adds company slug and worker pin

-- 1. Add slug to companies if not exists
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Helper function to generate clean URL slug
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Lowercase and remove accents
  slug := lower(unaccent(value));
  -- Replace anything not alphanumeric or space/hyphen with empty
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  -- Replace spaces and multiple hyphens with a single hyphen
  slug := regexp_replace(slug, '[\s-]+', '-', 'g');
  -- Trim leading/trailing hyphens
  slug := regexp_replace(slug, '(^-+|-+$)', '', 'g');
  RETURN slug;
EXCEPTION
  WHEN undefined_function THEN
    -- Fallback if unaccent extension is not enabled
    slug := lower(value);
    slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
    slug := regexp_replace(slug, '[\s-]+', '-', 'g');
    slug := regexp_replace(slug, '(^-+|-+$)', '', 'g');
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Populate existing company slugs using the helper
UPDATE public.companies SET slug = public.slugify(name) WHERE slug IS NULL;

-- 4. Create trigger to auto-generate slug on company insert/update
CREATE OR REPLACE FUNCTION public.companies_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR NEW.name <> OLD.name THEN
    NEW.slug := public.slugify(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_auto_slug ON public.companies;
CREATE TRIGGER trg_companies_auto_slug
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.companies_auto_slug();

-- 5. Add pin to workers if not exists
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS pin TEXT;

-- 6. Populate workers pin with DNI by default
UPDATE public.workers SET pin = dni WHERE pin IS NULL;
