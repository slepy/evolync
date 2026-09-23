-- Remove soft-delete from taggables: drop deleted_at column and its trigger.
-- taggables are now hard-deleted; sync uses DELETE instead of setting deleted_at.

DROP TRIGGER IF EXISTS on_taggables_updated ON public.taggables;
DROP FUNCTION IF EXISTS public.handle_taggables_updated();

ALTER TABLE public.taggables DROP COLUMN IF EXISTS deleted_at;
