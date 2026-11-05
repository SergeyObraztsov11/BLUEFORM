-- Directus uploads use a local volume, distinct from the shop's S3 storage.
ALTER TYPE "MediaSource" ADD VALUE IF NOT EXISTS 'DIRECTUS';
