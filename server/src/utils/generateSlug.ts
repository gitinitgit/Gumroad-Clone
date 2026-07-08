import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a URL-friendly slug from a string, appending a short unique suffix
 * to avoid collisions.
 */
export const generateSlug = (text: string): string => {
  const base = slugify(text, { lower: true, strict: true, trim: true });
  const suffix = uuidv4().slice(0, 6);
  return `${base}-${suffix}`;
};
